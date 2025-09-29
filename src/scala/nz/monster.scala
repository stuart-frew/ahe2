

case class Monster(
  name: String,
  expansion: String,
  awareness: Int,
  horror: HorrorCheck,
  combat: CombatCheck,
  toughness: Int,
  movement: String,
  special: List[String] = List.empty,
  tokenSize: String,
  borderColor: String,
  monsterType: String,
  dimension: String,
  frequency: Int,
  source: String,
  artAsset: String
)

case class HorrorCheck(
  modifier: Int,
  sanityDamage: Int
)

case class CombatCheck(
  modifier: Int,
  staminaDamage: Int
)
