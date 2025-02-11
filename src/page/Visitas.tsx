"use client";
import { useEffect, useState } from "react";
import { incrementVisits } from "../page/Actions.tsx";
const VisitCounter = () => {
  const [visits, setVisits] = useState<number>(0);

  useEffect(() => {
    const updateVisits = async () => {
      const newCount = await incrementVisits();
      setVisits(newCount);
    };
    updateVisits();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "#eee",
        padding: "10px",
        borderRadius: "8px",
      }}
    >
      <strong>Visitas:</strong> {visits}
    </div>
  );
};

export default VisitCounter;
