# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import ast
import json
import re
import typing
from datetime import datetime, timezone
from urllib.parse import urlparse

from genlayer import DynArray, gl, u256


class SubmissionVerifier(gl.Contract):
    verifier_name: str
    minimum_confidence_bps: u256
    allowed_domains: DynArray[str]
    last_payload_hash: str
    last_result_json: str
    last_reviewed_at: str

    def __init__(
        self,
        verifier_name: str = "Arc Verified Escrow Verifier",
        minimum_confidence_bps: u256 = 8600,
        allowed_domains: str | list[str] | None = None,
    ):
        self.verifier_name = verifier_name
        self.minimum_confidence_bps = minimum_confidence_bps
        self.last_payload_hash = ""
        self.last_result_json = ""
        self.last_reviewed_at = ""

        for domain in _coerce_domains(allowed_domains):
            normalized = _normalize_domain(domain)
            if normalized:
                self.allowed_domains.append(normalized)

    @gl.public.view
    def verify_submission(self, payload_json: str) -> dict[str, typing.Any]:
        payload = _parse_payload(payload_json)
        return self._evaluate_payload(payload)

    @gl.public.write
    def record_verification(self, payload_json: str) -> dict[str, typing.Any]:
        payload = _parse_payload(payload_json)
        result = self._evaluate_payload(payload)

        self.last_payload_hash = _payload_hash(payload_json)
        self.last_result_json = json.dumps(result)
        self.last_reviewed_at = datetime.now(timezone.utc).isoformat()
        return result

    @gl.public.view
    def get_last_result(self) -> dict[str, typing.Any]:
        if not self.last_result_json:
            return {
                "verdict": "uncertain",
                "confidence": 0.0,
                "reasons": ["No verification has been recorded yet."],
                "rawResult": None,
            }

        parsed = json.loads(self.last_result_json)
        parsed["recordedAt"] = self.last_reviewed_at
        parsed["payloadHash"] = self.last_payload_hash
        return parsed

    @gl.public.view
    def get_config(self) -> dict[str, typing.Any]:
        return {
            "verifierName": self.verifier_name,
            "minimumConfidenceBps": self.minimum_confidence_bps,
            "allowedDomains": list(self.allowed_domains),
        }

    def _evaluate_payload(self, payload: dict[str, typing.Any]) -> dict[str, typing.Any]:
        proof_links = _string_list(payload.get("proofLinks", []))
        acceptance_criteria = _string_list(payload.get("acceptanceCriteria", []))
        proof_requirements = _string_list(payload.get("proofRequirements", []))
        proof_evidence = _proof_evidence_list(payload.get("proofEvidence", []))
        title = str(payload.get("title", ""))
        description = str(payload.get("description", ""))
        submission_summary = str(payload.get("submissionSummary", ""))
        notes = str(payload.get("notes", ""))

        reasons: list[str] = []

        if not submission_summary.strip():
            return _normalize_result(
                {
                    "verdict": "needs_revision",
                    "confidence": 0.12,
                    "reasons": ["Submission summary is required."],
                    "rawResult": {"stage": "validation"},
                },
                self.minimum_confidence_bps,
            )

        if len(proof_links) == 0:
            reasons.append("No proof links were provided.")

        domain_findings = _validate_domains(proof_links, list(self.allowed_domains))
        reasons.extend(domain_findings)

        evidence_snippets = []
        for item in proof_evidence[:3]:
            evidence_snippets.append(
                {
                    "url": item.get("url"),
                    "fetchedUrl": item.get("fetchedUrl"),
                    "contentType": item.get("contentType"),
                    "status": item.get("status"),
                    "excerpt": str(item.get("excerpt", ""))[:4000],
                }
            )

        if len(evidence_snippets) == 0:
            for proof_link in proof_links[:3]:
                evidence_snippets.append(
                    {
                        "url": proof_link,
                        "status": "missing",
                        "excerpt": "No backend evidence excerpt was supplied for this proof link.",
                    }
                )

        combined_evidence = "\n".join(
            [submission_summary, notes, _join_evidence_excerpts(evidence_snippets), json.dumps(acceptance_criteria), json.dumps(proof_requirements)]
        ).lower()
        required_markers = _extract_required_markers(acceptance_criteria + proof_requirements)
        if len(reasons) == 0 and len(required_markers) > 0:
            missing_markers = [marker for marker in required_markers if marker.lower() not in combined_evidence]
            if len(missing_markers) == 0:
                return _normalize_result(
                    {
                        "verdict": "approved",
                        "confidence": 0.94,
                        "reasons": [
                            "Evidence satisfied the exact required markers declared in the milestone requirements.",
                        ],
                        "rawResult": {
                            "matchedMarkers": required_markers,
                            "evidenceSnippets": evidence_snippets,
                            "checkedAt": datetime.now(timezone.utc).isoformat(),
                        },
                    },
                    self.minimum_confidence_bps,
                )

        def evaluate_submission() -> str:
            task = f"""
You are a verification engine for a freelance escrow marketplace.
Your task is to determine whether a milestone submission should be approved, sent back for revision, rejected, or marked uncertain.

Inputs:
<title>
{title}
</title>

<description>
{description}
</description>

<acceptance_criteria>
{json.dumps(acceptance_criteria)}
</acceptance_criteria>

<proof_requirements>
{json.dumps(proof_requirements)}
</proof_requirements>

<submission_summary>
{submission_summary}
</submission_summary>

<notes>
{notes}
</notes>

<proof_links>
{json.dumps(proof_links)}
</proof_links>

<evidence_snippets>
{json.dumps(evidence_snippets)}
</evidence_snippets>

<constraints>
- Approve only if the evidence clearly satisfies the acceptance criteria.
- Return needs_revision when work looks partly complete, unclear, or missing proof.
- Return rejected when the work clearly fails the requirements or is misleading.
- Return uncertain when available information is too ambiguous to decide.
- Confidence must be between 0 and 1.
- Reasons must be concise and factual.
</constraints>

Return valid JSON only with this shape:
{{
  "verdict": "approved|needs_revision|rejected|uncertain",
  "confidence": 0.0,
  "reasons": ["reason 1", "reason 2"]
}}
"""
            result = gl.exec_prompt(task)
            return result

        llm_result = None
        try:
            llm_result = gl.eq_principle_prompt_comparative(
                evaluate_submission,
                principle="The verdict field must match exactly. Confidence may vary slightly. Reasons should be materially equivalent.",
            )
            parsed_result = _safe_json_dict(llm_result)
        except Exception as exc:
            parsed_result = {
                "verdict": "uncertain",
                "confidence": 0.2,
                "reasons": [f"Verifier could not parse the model response: {str(exc)}"],
                "rawResult": {
                    "modelOutput": str(llm_result) if llm_result is not None else None,
                },
            }

        if len(reasons) > 0:
            existing_reasons = _string_list(parsed_result.get("reasons", []))
            parsed_result["reasons"] = existing_reasons + reasons

        raw_result = parsed_result.get("rawResult")
        parsed_result["rawResult"] = {
            "evidenceSnippets": evidence_snippets,
            "checkedAt": datetime.now(timezone.utc).isoformat(),
        }
        if raw_result is not None:
            parsed_result["rawResult"]["model"] = raw_result

        return _normalize_result(parsed_result, self.minimum_confidence_bps)


def _parse_payload(payload_json: str) -> dict[str, typing.Any]:
    payload = _safe_json_dict(payload_json)
    required_keys = [
        "jobId",
        "milestoneId",
        "title",
        "description",
        "acceptanceCriteria",
        "proofRequirements",
        "submissionSummary",
        "proofLinks",
    ]
    for key in required_keys:
        if key not in payload:
            raise ValueError(f"Missing required payload field: {key}")
    return payload


def _normalize_result(result: dict[str, typing.Any], minimum_confidence_bps: int) -> dict[str, typing.Any]:
    verdict = str(result.get("verdict", "uncertain")).strip().lower()
    if verdict not in ["approved", "needs_revision", "rejected", "uncertain"]:
        verdict = "uncertain"

    confidence = result.get("confidence", 0.5)
    try:
        confidence_value = float(confidence)
    except Exception:
        confidence_value = 0.5

    if confidence_value < 0:
        confidence_value = 0.0
    if confidence_value > 1:
        confidence_value = 1.0

    if verdict == "approved" and int(confidence_value * 10000) < minimum_confidence_bps:
        verdict = "uncertain"

    reasons = _string_list(result.get("reasons", []))
    if len(reasons) == 0:
        reasons = ["Verifier returned no explicit reason."]

    return {
        "verdict": verdict,
        "confidence": str(confidence_value),
        "reasons": reasons,
        "rawResult": result.get("rawResult"),
    }


def _safe_json_dict(value: typing.Any) -> dict[str, typing.Any]:
    if isinstance(value, dict):
        return value

    text = str(value)
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace >= 0 and last_brace >= first_brace:
        text = text[first_brace:last_brace + 1]

    text = re.sub(r",(\s*[}\]])", r"\1", text)
    try:
        parsed = json.loads(text)
    except Exception:
        parsed = ast.literal_eval(text)
    if not isinstance(parsed, dict):
        raise ValueError("Expected a JSON object.")
    return parsed


def _string_list(value: typing.Any) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value]
    return []


def _proof_evidence_list(value: typing.Any) -> list[dict[str, typing.Any]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]


def _coerce_domains(value: str | list[str] | None) -> list[str]:
    if value is None:
        return []

    if isinstance(value, list):
        return [str(item) for item in value]

    sanitized = value.strip()
    if not sanitized:
        return []

    if sanitized.startswith("[") and sanitized.endswith("]"):
        sanitized = sanitized[1:-1]

    return [segment.strip().strip('"').strip("'") for segment in sanitized.split(",") if segment.strip()]


def _extract_required_markers(values: list[str]) -> list[str]:
    markers = []
    for value in values:
        markers.extend(re.findall(r"`([^`]+)`", value))
    return [marker.strip() for marker in markers if marker.strip()]


def _join_evidence_excerpts(values: list[dict[str, typing.Any]]) -> str:
    return "\n".join([str(value.get("excerpt", "")) for value in values])


def _normalize_domain(domain: str) -> str:
    return domain.strip().lower().replace("http://", "").replace("https://", "").replace("www.", "").rstrip("/")


def _validate_domains(proof_links: list[str], allowed_domains: list[str]) -> list[str]:
    if len(allowed_domains) == 0:
        return []

    issues = []
    for link in proof_links:
        try:
            domain = urlparse(link).netloc.lower().replace("www.", "")
        except Exception:
            domain = ""
        if domain and domain not in allowed_domains:
            issues.append(f"Proof link domain {domain} is not in the allowed domain list.")
    return issues


def _payload_hash(payload_json: str) -> str:
    sanitized = payload_json.strip()
    if len(sanitized) <= 64:
        return sanitized
    return sanitized[:64]
