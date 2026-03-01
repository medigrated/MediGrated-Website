// client/src/pages/patient-view/recommendations.jsx
import React from "react";

// feature removed placeholder

function PlaceItem({ place }) {
  const name = place.name || "Unknown";
  const addr = place.address || "";
  const dist = place.distanceKm ?? null;
  const external = place.googleLink || place.osmLink || "#";

  return (
    <div className="p-3 border rounded-md flex items-start gap-3 bg-card">
      <div className="p-2 rounded-md bg-muted/20">
        <MapPin />
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-medium text-lg">{name}</h3>
            <div className="text-sm text-muted-foreground mt-1">{addr}</div>
          </div>
          {dist !== null && (
            <div className="text-sm text-muted-foreground text-right">
              <div>{dist} km</div>
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <a className="text-sm underline inline-flex items-center gap-1" target="_blank" rel="noreferrer" href={external}>
            Open in maps <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Recommendations() {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-semibold">Feature Removed</h2>
      <p className="mt-4 text-muted-foreground">
        The nearby recommendations feature has been removed from the application.
      </p>
    </div>
  );
}
