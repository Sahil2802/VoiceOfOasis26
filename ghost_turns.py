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


def next_expected(agent_text: str, expected: str, last_user_text: str) -> str:
    """Who speaks after Noor's line. While Noor waits on the operator and only silence came back,
    her "Did you know" fact to the visitor fills the gap; the operator is still due to answer."""
    who = addressed(agent_text)
    silent = last_user_text.strip(" .…") == ""
    return OPERATOR if who == VISITOR and expected == OPERATOR and silent else who


def context_note(who: str) -> str:
    """Hidden note to the agent (contextual_update) after Noor speaks."""
    return "Next speaker: %s. Unless the next message clearly says otherwise, it is from the %s." % (
        who.upper(), who.upper())


if __name__ == "__main__":
    assert addressed("Operator, please take us to the nearest reception or staff member.") == OPERATOR
    assert addressed("Excuse me, I'm Noor, the AI on this robot. Could you tell us...") == RECEPTIONIST
    assert addressed("We're on our way! Fun fact: ...") == VISITOR
    assert addressed("صباح الخير يا عمار") == VISITOR
    assert speaker("Hey, this is the receptionist. Tell me.", OPERATOR) == RECEPTIONIST
    assert speaker("We're here, you are at reception.", OPERATOR) == OPERATOR
    assert speaker("Take the first left, then the elevator.", RECEPTIONIST) == RECEPTIONIST
    # a "Did you know" fact during the silent wait keeps the operator as next speaker
    assert next_expected("Did you know Dtec has two campuses?", OPERATOR, "...") == OPERATOR
    assert next_expected("Did you know Dtec has two campuses?", OPERATOR, "") == OPERATOR
    # once the operator has actually spoken, Noor talking to the visitor hands the turn over
    assert next_expected("We're on our way!", OPERATOR, "On our way.") == VISITOR
    assert next_expected("Excuse me, I'm Noor, the AI on this robot.", OPERATOR, "...") == RECEPTIONIST
    print("ghost_turns ok")
