// Picks the shortest recognisable name out of a Google reverse-geocode result.
// formatted_address is a last resort: "12, Jalan Hang Tuah, 75300 Melaka,
// Malaysia" is four times wider than the trip panel row it has to sit in.
const PREFERRED_TYPES = [
  "point_of_interest",
  "premise",
  "route",
  "neighborhood",
  "sublocality",
  "locality",
];

export function shortPlaceName(result) {
  if (!result) return "";
  const components = result.address_components || [];
  for (const type of PREFERRED_TYPES) {
    const match = components.find((component) => (component.types || []).includes(type));
    if (match?.short_name) return match.short_name;
  }
  return (result.formatted_address || "").split(",")[0].trim();
}
