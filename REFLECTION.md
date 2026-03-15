# 🪞 REFLECTION.md — AI Agent Collaboration Essay

## What I Learned Using AI Agents

Building the FuelEU Maritime compliance platform with Claude as a coding agent revealed both the extraordinary leverage and the necessary discipline that effective AI-assisted development demands.

The most striking insight was how much **architecture clarity amplifies agent output quality**. When I provided Claude with a well-defined hexagonal structure upfront — specifying which interfaces lived in `core/ports`, which implementations went in `adapters/repositories`, and which had zero framework imports — the generated code required almost no structural revision. The agent internalized the constraints and applied them consistently across all five use cases. This confirmed a principle I now hold firmly: AI agents are exceptional at expanding a correctly-specified skeleton, but poor at inventing structure from vague requirements.

The **domain model phase** was where the agent delivered the most disproportionate value. Translating the FuelEU Annex IV formula (`CB = (Target − Actual) × Energy in scope`) into a typed TypeScript use case — with proper energy-content lookup per fuel type, year-based target switching, and dependency-inverted repository access — would have taken 45–60 minutes manually. With a well-scoped prompt, it took under 5 minutes of generation and 10 minutes of cross-referencing the regulatory PDF. That 6× speed ratio on domain modeling was the highest-leverage moment of the entire project.

I also learned that **test generation requires the most human judgment**. The agent's first draft of `CreatePool.test.ts` had correct structure and mocks, but its assertions for the greedy allocation algorithm were too coarse — they verified that `addMember` was called, but not what `cbAfter` values were assigned. I had to specify explicit expected values (`expect(r002After).toBe(100)`) to make the test actually enforce the algorithm's correctness. This is the class of bug AI agents miss: structural plausibility vs. semantic correctness.

---

## Efficiency Gains vs Manual Coding

| Task | Manual Estimate | With Agent | Ratio |
|------|----------------|------------|-------|
| Domain entities + port interfaces | 60 min | 8 min | 7.5× |
| 5 use-case implementations | 150 min | 25 min | 6× |
| 3 PostgreSQL repository adapters | 90 min | 20 min | 4.5× |
| 4 Express controllers | 60 min | 12 min | 5× |
| 20+ unit tests | 120 min | 30 min | 4× |
| Frontend hooks + components | 180 min | 45 min | 4× |
| Tailwind theming + layout | 90 min | 20 min | 4.5× |
| Documentation (README, AGENT_WORKFLOW) | 60 min | 15 min | 4× |
| **Total** | **~14 hours** | **~3 hours** | **~4.7×** |

The net speedup across the full project was approximately **4–5×**. This understates the qualitative value in one dimension: the agent maintained strict TypeScript types and consistent naming conventions throughout, a discipline that typically degrades over long coding sessions.

---

## Improvements I Would Make Next Time

**1. Extract a composition root earlier.** In the current implementation, each HTTP controller directly instantiates its repositories and use-cases. This works, but makes integration testing harder and couples the adapter layer to specific implementations. Next time I would prompt for a dedicated `container.ts` or dependency injection setup from the start, making test substitution trivial.

**2. Prompt for integration tests alongside unit tests.** The assignment called for Supertest integration tests. I generated these manually after the fact. A better workflow would be to prompt for both unit and integration test skeletons simultaneously, specifying the Supertest patterns and in-memory database setup required.

**3. Use structured output prompts for database schemas.** When asking the agent to design the PostgreSQL schema, I received a CREATE TABLE script. A better approach would be to ask for a migration file with `UP` and `DOWN` functions, versioned with timestamps — production-grade from day one rather than the simplified `DROP IF EXISTS` pattern used here.

**4. Validate regulatory interpretation before coding.** I caught a subtle ambiguity in the `percentDiff` formula (baseline vs comparison direction) only after the agent had already implemented it. Maintaining a "regulatory assumptions" document and asking the agent to flag any implied decisions would surface these earlier.

**5. Commit incrementally with agent-generated commit messages.** The assignment requires incremental commit history. In practice, agent-assisted coding produces large logical chunks quickly. A discipline of committing after each agent generation cycle — with a brief human-authored message summarizing the agent's contribution — would make the history more transparent and educational.

---

*The clearest conclusion: AI agents don't replace architectural judgment or regulatory domain expertise — they amplify them. The developer who understands hexagonal architecture and FuelEU Annex IV gets 5× leverage. The developer who doesn't understands neither gets 5× confusion.*
