"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "../lib/api";

interface TelemetryUpdate {
  facilityId: string;
  lat: number;
  lng: number;
  isInsideGeofence: boolean;
}

interface GeoBounds {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

const VIEWPORT = { width: 480, height: 320 };

function project(lat: number, lng: number, bounds: GeoBounds) {
  const x =
    ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * VIEWPORT.width;
  // lat increases northward, SVG y increases downward, so flip.
  const y =
    (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * VIEWPORT.height;
  return { x, y };
}

export function DigitalTwinViewer({
  facilityId,
  bounds = { minLng: -122.42, maxLng: -122.41, minLat: 37.77, maxLat: 37.78 },
}: {
  facilityId: string;
  bounds?: GeoBounds;
}) {
  const [robot, setRobot] = useState<TelemetryUpdate | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(`${API_URL}/telemetry`, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", { facilityId });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("telemetry:update", (payload: TelemetryUpdate) => {
      if (payload.facilityId === facilityId) {
        setRobot(payload);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [facilityId]);

  const position = robot ? project(robot.lat, robot.lng, bounds) : null;

  return (
    <div className="silas-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-silas-cyan">
          Digital Twin Viewer
        </h3>
        <span
          className={`text-xs ${connected ? "text-silas-cyan" : "text-silas-ink-soft/60"}`}
        >
          {connected ? "● live" : "○ connecting"}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${VIEWPORT.width} ${VIEWPORT.height}`}
        className="w-full rounded-xl border border-silas-border/50 bg-silas-void"
      >
        {/* Facility zones — simple demo layout */}
        <rect
          x={20}
          y={20}
          width={200}
          height={120}
          rx={10}
          className="fill-silas-navy-soft stroke-silas-border/60"
        />
        <text x={30} y={40} className="fill-silas-ink-soft text-[10px]">
          Zone A
        </text>
        <rect
          x={260}
          y={20}
          width={200}
          height={280}
          rx={10}
          className="fill-silas-navy-soft stroke-silas-border/60"
        />
        <text x={270} y={40} className="fill-silas-ink-soft text-[10px]">
          Zone B
        </text>
        <rect
          x={20}
          y={180}
          width={200}
          height={120}
          rx={10}
          className="fill-silas-navy-soft stroke-silas-border/60"
        />
        <text x={30} y={200} className="fill-silas-ink-soft text-[10px]">
          Zone C
        </text>

        {position ? (
          <circle
            cx={position.x}
            cy={position.y}
            r={8}
            className={
              robot?.isInsideGeofence
                ? "fill-silas-cyan transition-all duration-500 ease-out"
                : "fill-red-400 transition-all duration-500 ease-out"
            }
          />
        ) : null}
      </svg>

      <p className="mt-2 text-xs text-silas-ink-soft">
        {robot
          ? `Last ping: ${robot.lat.toFixed(5)}, ${robot.lng.toFixed(5)} — ${
              robot.isInsideGeofence ? "inside geofence" : "outside geofence"
            }`
          : "Waiting for telemetry…"}
      </p>
    </div>
  );
}
