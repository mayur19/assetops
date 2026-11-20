# ADR-0001: Record architecture decisions

- Status: Accepted
- Date: 2026-11-20

## Context

AssetOps is a multi-tenant maintenance management system built incrementally from a
PRD ([docs/product/PRD.md](../product/PRD.md)). Most of the product is still pending
(see [backlog](../planning/backlog.md)). Contributors joining later need to know why the
foundation looks the way it does before extending it.

## Decision Drivers

- Decisions must survive staff changes and be reviewable in pull requests.
- Lightweight: no external tooling, plain Markdown in the repository.
- Code comments should be able to point at a stable identifier (`ADR-0003`).

## Considered Options

1. MADR files in `docs/adr/`, numbered sequentially.
2. A wiki outside the repository.
3. No formal record; rely on commit messages.

## Decision Outcome

Chosen option 1. Each significant decision gets `docs/adr/NNNN-kebab-title.md` in MADR
format. Numbers 0001-0012 are reserved for platform decisions; 0013+ are product decisions.
Accepted ADRs are immutable except for status; a reversal is a new ADR that supersedes the old.

## Consequences

### Positive

- Source code references (`ADR-0013`) resolve to a file in the same commit.
- Decisions are reviewed alongside the code that implements them.

### Negative

- Requires discipline to write an ADR before, not after, a contentious change.

## Links

- [ADR index](README.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
