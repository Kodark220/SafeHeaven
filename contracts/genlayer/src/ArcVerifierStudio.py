# { "Depends": "py-genlayer:test" }

"""
Arc Verified Escrow — Studio Verifier
=====================================
Studio-compatible version of the SubmissionVerifier.
Runs on GenLayer Studio (local simulator) as a fallback
when the Bradbury testnet is unavailable.

Uses Studio-style imports (from genlayer import *) and
gl.nondet patterns instead of the Bradbury production patterns.

Deploy on Studio, then set these env vars in your backend:
  GENLAYER_STUDIO_RPC_URL=http://localhost:4000/api
  GENLAYER_STUDIO_CONTRACT_ADDRESS=<your-studio-address>
"""

import json
from genlayer import *


class ArcVerifierStudio(gl.Contract):
    verifier_name: str
    minimum_confidence_bps: u256
    last_result_json: str
    last_reviewed_at: str

    def __init__(self):
        self.verifier_name = "Arc Verified Escrow Verifier (Studio)"
        self.minimum_confidence_bps = u256(8600)
        self.last_result_json = ""
        self.last_reviewed_at = ""

    def _evaluate_payload(self, payload: dict) -> dict:
        """
        Core verification logic. Fetches proof URLs via gl.nondet.web
        and uses AI consensus to evaluate the submission.
        """
        title = str(payload.get("title", ""))
        description = str(payload.get("description", ""))
        submission_summary = str(payload.get("submissionSummary", ""))
        notes = str(payload.get("notes", ""))
        proof_links = payload.get("proofLinks", [])
        acceptance_criteria = payload.get("acceptanceCriteria", [])
        proof_requirements = payload.get("proofRequirements", [])

        if not submission_summary.strip():
            return {
                "verdict": "needs_revision",
                "confidence": "0.12",
                "reasons": ["Submission summary is required."],
            }

        # Fetch evidence from proof links using Studio nondet web
        evidence_snippets = []
        for link in proof_links[:3]:
            try:
                web_data = gl.nondet.web.get(link, mode="text")
                evidence_snippets.append({
                    "url": link,
                    "status": "fetched",
                    "excerpt": str(web_data)[:4000],
                })
            except Exception as e:
                evidence_snippets.append({
                    "url": link,
                    "status": "failed",
                    "excerpt": str(e),
                })

        def evaluate_submission() -> str:
            task = f"""
You are a verification engine for a freelance escrow marketplace.
Determine whether a milestone submission should be approved, sent back
for revision, rejected, or marked uncertain.

<title>{title}</title>
<description>{description}</description>
<acceptance_criteria>{json.dumps(acceptance_criteria)}</acceptance_criteria>
<proof_requirements>{json.dumps(proof_requirements)}</proof_requirements>
<submission_summary>{submission_summary}</submission_summary>
<notes>{notes}</notes>
<proof_links>{json.dumps(proof_links)}</proof_links>
<evidence_snippets>{json.dumps(evidence_snippets)}</evidence_snippets>

Rules:
- Approve only if evidence clearly satisfies acceptance criteria.
- needs_revision when partly complete or missing proof.
- rejected when work clearly fails requirements.
- uncertain when too ambiguous to decide.
- Confidence between 0 and 1. Reasons must be concise.

Return valid JSON only:
{{
  "verdict": "approved|needs_revision|rejected|uncertain",
  "confidence": 0.0,
  "reasons": ["reason 1", "reason 2"]
}}
It is mandatory that you respond only using the JSON format above,
nothing else. Don't include any other words or characters,
your output must be only JSON without any formatting prefix or suffix.
This result should be perfectly parsable by a JSON parser without errors.
"""
            result = gl.nondet.exec_prompt(task, response_format="json")
            return json.dumps(result, sort_keys=True)

        result_json = json.loads(
            gl.eq_principle.strict_eq(evaluate_submission)
        )

        # Normalize
        verdict = str(result_json.get("verdict", "uncertain")).strip().lower()
        if verdict not in ["approved", "needs_revision", "rejected", "uncertain"]:
            verdict = "uncertain"

        confidence = 0.5
        try:
            confidence = float(result_json.get("confidence", 0.5))
        except Exception:
            pass
        confidence = max(0.0, min(1.0, confidence))

        if verdict == "approved" and int(confidence * 10000) < int(self.minimum_confidence_bps):
            verdict = "uncertain"

        reasons = result_json.get("reasons", [])
        if not isinstance(reasons, list) or len(reasons) == 0:
            reasons = ["Verifier returned no explicit reason."]
        else:
            reasons = [str(r) for r in reasons]

        return {
            "verdict": verdict,
            "confidence": str(confidence),
            "reasons": reasons,
            "rawResult": {"evidenceSnippets": evidence_snippets},
        }

    @gl.public.view
    def verify_submission(self, payload_json: str) -> dict:
        """Read-only verification — same interface as Bradbury contract."""
        payload = json.loads(payload_json)
        _validate_payload(payload)
        return self._evaluate_payload(payload)

    @gl.public.write
    def record_verification(self, payload_json: str) -> dict:
        """Write verification — persists result on-chain."""
        payload = json.loads(payload_json)
        _validate_payload(payload)
        result = self._evaluate_payload(payload)
        self.last_result_json = json.dumps(result)
        self.last_reviewed_at = "studio-recorded"
        return result

    @gl.public.view
    def get_last_result(self) -> dict:
        if not self.last_result_json:
            return {
                "verdict": "uncertain",
                "confidence": "0.0",
                "reasons": ["No verification has been recorded yet."],
            }
        parsed = json.loads(self.last_result_json)
        parsed["recordedAt"] = self.last_reviewed_at
        return parsed

    @gl.public.view
    def get_config(self) -> dict:
        return {
            "verifierName": self.verifier_name,
            "minimumConfidenceBps": int(self.minimum_confidence_bps),
            "environment": "studio",
        }


def _validate_payload(payload: dict):
    """Ensure required fields are present."""
    required = [
        "jobId", "milestoneId", "title", "description",
        "acceptanceCriteria", "proofRequirements",
        "submissionSummary", "proofLinks",
    ]
    for key in required:
        if key not in payload:
            raise Exception(f"Missing required payload field: {key}")
