
export function costForParts(parts: BodyPartConstant[]): number {
  let cost = 0;
  for (const part of parts) {
    switch (part) {
      case MOVE:
        cost += BODYPART_COST.move;
        break;
      case WORK:
        cost += BODYPART_COST.work;
        break;
      case ATTACK:
        cost += BODYPART_COST.attack;
        break;
      case CARRY:
        cost += BODYPART_COST.carry;
        break;
      case HEAL:
        cost += BODYPART_COST.heal;
        break;
      case RANGED_ATTACK:
        cost += BODYPART_COST.ranged_attack;
        break;
      case TOUGH:
        cost += BODYPART_COST.tough;
        break;
      case CLAIM:
        cost += BODYPART_COST.claim;
        break;
    }
  }

  return cost;
}
