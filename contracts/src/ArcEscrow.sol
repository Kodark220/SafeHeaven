// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcEscrow {
    error Unauthorized();
    error InvalidAddress();
    error InvalidArrayLengths();
    error JobAlreadyExists();
    error JobNotFound();
    error MilestoneAlreadyExists();
    error MilestoneNotFound();
    error MilestoneAlreadyReleased();
    error FundingMismatch();
    error TransferFailed();

    address public immutable OWNER;

    struct Job {
        address client;
        address worker;
        uint256 totalFunded;
        uint256 totalReleased;
        bool exists;
    }

    struct Milestone {
        uint256 amount;
        bool released;
        bool exists;
    }

    mapping(bytes32 => Job) private jobs;
    mapping(bytes32 => mapping(bytes32 => Milestone)) private milestones;

    event JobCreated(bytes32 indexed jobId, address indexed client, address indexed worker, uint256 totalFunded);
    event MilestoneReleased(bytes32 indexed jobId, bytes32 indexed milestoneId, address indexed worker, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != OWNER) revert Unauthorized();
        _;
    }

    constructor() {
        OWNER = msg.sender;
    }

    function createJob(
        bytes32 jobId,
        address client,
        address worker,
        bytes32[] calldata milestoneIds,
        uint256[] calldata amounts
    ) external payable onlyOwner {
        if (client == address(0) || worker == address(0)) revert InvalidAddress();
        if (milestoneIds.length == 0 || milestoneIds.length != amounts.length) revert InvalidArrayLengths();
        if (jobs[jobId].exists) revert JobAlreadyExists();

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < milestoneIds.length; i++) {
            bytes32 milestoneId = milestoneIds[i];
            if (milestones[jobId][milestoneId].exists) revert MilestoneAlreadyExists();

            uint256 amount = amounts[i];
            totalAmount += amount;
            milestones[jobId][milestoneId] = Milestone({ amount: amount, released: false, exists: true });
        }

        if (totalAmount != msg.value) revert FundingMismatch();

        jobs[jobId] = Job({
            client: client,
            worker: worker,
            totalFunded: totalAmount,
            totalReleased: 0,
            exists: true
        });

        emit JobCreated(jobId, client, worker, totalAmount);
    }

    function releaseMilestone(bytes32 jobId, bytes32 milestoneId) external onlyOwner returns (uint256 amount) {
        Job storage job = jobs[jobId];
        if (!job.exists) revert JobNotFound();

        Milestone storage milestone = milestones[jobId][milestoneId];
        if (!milestone.exists) revert MilestoneNotFound();
        if (milestone.released) revert MilestoneAlreadyReleased();

        amount = milestone.amount;
        milestone.released = true;
        job.totalReleased += amount;

        (bool success, ) = payable(job.worker).call{ value: amount }("");
        if (!success) revert TransferFailed();

        emit MilestoneReleased(jobId, milestoneId, job.worker, amount);
    }

    function getJob(bytes32 jobId)
        external
        view
        returns (address client, address worker, uint256 totalFunded, uint256 totalReleased, bool exists)
    {
        Job memory job = jobs[jobId];
        return (job.client, job.worker, job.totalFunded, job.totalReleased, job.exists);
    }

    function getMilestone(bytes32 jobId, bytes32 milestoneId)
        external
        view
        returns (uint256 amount, bool released, bool exists)
    {
        Milestone memory milestone = milestones[jobId][milestoneId];
        return (milestone.amount, milestone.released, milestone.exists);
    }
}
