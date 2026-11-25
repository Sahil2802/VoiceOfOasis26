"""Who speaks next? One microphone hears visitor, operator and receptionist alike, so we infer the speaker
from whom Noor addressed last (her prompt opens operator lines with "Operator," and staff lines with
"Excuse me, I'm Noor"). No ROS imports: run `python3 ghost_turns.py` to self-check."""
import re

VISITOR, OPERATOR, RECEPTIONIST = "visitor", "operator", "receptionist"

# ponytail: keyword guess, swap for real speaker ID if the demo needs it
_STAFF_INTRO = re.compile(r"\b(this is|i'?m|i am)\b.{0,20}\b(reception(ist)?|staff)\b", re.I)


def addressed(agent_text: str) -> str:
    """Whom Noor's message is for, so who should answer next."""
    t = agent_text.strip().lower()
    if t.startswith("operator"):
        return OPERATOR
    if t.startswith("excuse me") and "noor" in t:
        return RECEPTIONIST
    return VISITOR


def speaker(user_text: str, expected: str) -> str:
    """The expected speaker, unless staff introduce themselves out of turn (counts as arrival)."""
    return RECEPTIONIST if _STAFF_INTRO.search(user_text) else expected


def context_note(who: str) -> str:
    """Hidden note to the agent (contextual_update) after Noor speaks."""
    return "Noor just spoke to the %s. Unless the next message clearly says otherwise, it is from the %s." % (
        who.upper(), who.upper())


if __name__ == "__main__":
    assert addressed("Operator, please take us to the nearest reception or staff member.") == OPERATOR
    assert addressed("Excuse me, I'm Noor, the AI on this robot. Could you tell us...") == RECEPTIONIST
    assert addressed("We're on our way! Fun fact: ...") == VISITOR
    assert addressed("صباح الخير يا عمار") == VISITOR
    assert speaker("Hey, this is the receptionist. Tell me.", OPERATOR) == RECEPTIONIST
    assert speaker("We're here, you are at reception.", OPERATOR) == OPERATOR
    assert speaker("Take the first left, then the elevator.", RECEPTIONIST) == RECEPTIONIST
    print("ghost_turns ok")
