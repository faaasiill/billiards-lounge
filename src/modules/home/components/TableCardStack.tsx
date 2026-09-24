import React, { useRef, useState } from "react";

type CardData = {
  id: number;
  table: string;
  status: string;
  image: string;
  badge?: string;
};

const CARDS: CardData[] = [
  {
    id: 1,
    table: "Table 06",
    status: "Make your shot count.",
    image: "https://i.pinimg.com/1200x/ef/3a/f3/ef3af32ec2629068f2ce7a7c5f32052c.jpg",
  },
  {
    id: 2,
    table: "Table 04",
    status: "Good games start here.",
    image:
      "https://images.unsplash.com/photo-1642376826232-3d2f86692bb5?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 3,
    table: "Table 02",
    status: "Aim. Strike. Repeat.",
    image:
      "https://i.pinimg.com/736x/51/7d/cb/517dcb13b4a7a595197a06555b85f333.jpg",
    badge: "2",
  },
];

// rank 0 = front (largest), rank 2 = back (smallest)
const SLOTS = [
  { w: 268, h: 328, x: 0, y: 24, rotate: 0 },
  { w: 228, h: 288, x: -72, y: 6, rotate: -9 },
  { w: 198, h: 250, x: 64, y: -10, rotate: 8 },
];

const DRAG_THRESHOLD = 6;
const SEND_TO_BACK_DISTANCE = 140;
const RECEDE_MAX_DISTANCE = 260;
const RECEDE_FLIP_PROGRESS = 0.55;
const PEEK_X = 24;
const PEEK_Y = 10;
const PEEK_ROTATE = 3.5;

const TableCardStack = () => {
  const [order, setOrder] = useState(CARDS.map((c) => c.id));
  const [dragId, setDragId] = useState<number | null>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const start = useRef({ x: 0, y: 0 });

  const spreadActive = dragId !== null;

  const bringToFront = (id: number) =>
    setOrder((prev) => [id, ...prev.filter((c) => c !== id)]);

  const sendToBack = (id: number) =>
    setOrder((prev) => [...prev.filter((c) => c !== id), id]);

  const onPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    id: number,
    rank: number,
  ) => {
    if (rank !== 0) {
      bringToFront(id);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDragId(id);
    setDrag({ x: 0, y: 0 });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragId === null) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
  };

  const endDrag = () => {
    if (dragId === null) return;
    if (Math.hypot(drag.x, drag.y) > SEND_TO_BACK_DISTANCE) sendToBack(dragId);
    setDragId(null);
    setDrag({ x: 0, y: 0 });
  };

  return (
    <div className="relative mx-auto" style={{ width: 380, height: 352 }}>
      {CARDS.map((card) => {
        const rank = order.indexOf(card.id);
        const slot = SLOTS[rank];
        const beingDragged = dragId === card.id;
        const totalDistance = beingDragged ? Math.hypot(drag.x, drag.y) : 0;
        const hasMoved = totalDistance > DRAG_THRESHOLD;
        const progress = Math.min(
          (hasMoved ? totalDistance : 0) / RECEDE_MAX_DISTANCE,
          1,
        );

        // Back cards peek outward the moment the front card is touched (tap or drag).
        const peek = rank !== 0 && spreadActive ? 1 : 0;
        const dir = Math.sign(slot.x) || (rank === 1 ? -1 : 1);
        const peekX = dir * PEEK_X * peek;
        const peekY = -PEEK_Y * peek;
        const peekRotate = Math.sign(slot.rotate) * PEEK_ROTATE * peek;

        // Front card only moves once an actual drag (past the threshold) is detected.
        const x = slot.x + peekX + (beingDragged && hasMoved ? drag.x : 0);
        const y = slot.y + peekY + (beingDragged && hasMoved ? drag.y : 0);
        const rotate =
          slot.rotate +
          peekRotate +
          (beingDragged && hasMoved ? drag.x / 14 : 0);
        const scale = beingDragged && hasMoved ? 1.05 - 0.23 * progress : 1;
        const baseZ = (CARDS.length - rank) * 10;
        const zIndex =
          beingDragged && hasMoved && progress > RECEDE_FLIP_PROGRESS
            ? 5
            : baseZ;

        return (
          <div
            key={card.id}
            onPointerDown={(e) => onPointerDown(e, card.id, rank)}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={[
              "absolute left-1/2 top-0 select-none overflow-hidden rounded-4xl border-ivory/20 bg-felt-dark bg-cover bg-center light:border-felt-dark/20 light:bg-ivory",
              rank === 0
                ? beingDragged
                  ? "cursor-grabbing"
                  : "cursor-grab"
                : "cursor-pointer",
              beingDragged && hasMoved
                ? ""
                : "transition-all duration-300 ease-out",
            ].join(" ")}
            style={{
              width: slot.w,
              height: slot.h,
              zIndex,
              touchAction: "none",
              backgroundImage: `url(${card.image})`,
              transform: `translate(-50%, 0) translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`,
            }}
          >
            {/* Bottom scrim: kept dark in both themes on purpose — this
                sits directly on a photo, not the page background, and a
                dark-to-transparent fade is what keeps the label readable
                over any image regardless of light/dark mode. */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
              style={{
                background:
                  "linear-gradient(to top, rgba(11,36,28,0.95), rgba(11,36,28,0))",
              }}
            />

            <div className="relative flex h-full flex-col p-5">
              <div className="mt-auto">
                <span className="block text-xs leading-none tracking-tighter text-ivory/70">
                  {card.table}
                </span>

                <div className="mt-1 font-medium leading-none tracking-tighter text-ivory">
                  {card.status}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TableCardStack;