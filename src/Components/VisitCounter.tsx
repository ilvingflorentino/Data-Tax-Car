// src/components/VisitCounter.tsx
import React, { useEffect, useState } from "react";
import { incrementVisitCount, getVisitCount } from "../Services/visitService";

const VisitCounter: React.FC = () => {
  const [visits, setVisits] = useState<number>(0);

  useEffect(() => {
    const updateVisits = async () => {
      const hasVisited = sessionStorage.getItem("hasVisited");
      if (!hasVisited) {
        await incrementVisitCount(); // Incrementa el contador en Firebase solo si es la primera visita de la sesión
        sessionStorage.setItem("hasVisited", "true");
      }
      const count = await getVisitCount(); // Obtiene el número actual de visitas
      setVisits(count);
    };

    updateVisits();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        backgroundColor: "white",
        padding: "10px",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      }}
    >
      <strong>Visitas:</strong> {visits}
    </div>
  );
};

export default VisitCounter;
