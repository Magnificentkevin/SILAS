import * as Location from "expo-location";
import type { GeoPoint } from "@repo/contracts";

/** Requests foreground location permission (if not already granted) and returns one fix. */
export async function getCurrentGeoPoint(): Promise<GeoPoint | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;

  const position = await Location.getCurrentPositionAsync({});
  return {
    type: "Point",
    coordinates: [position.coords.longitude, position.coords.latitude],
  };
}
