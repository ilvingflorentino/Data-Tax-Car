import React, { useEffect, useState } from "react";
import { db } from "../Services/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const ExchangeRate: React.FC<{
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
}> = ({ exchangeRate, setExchangeRate }) => {
  const [loading, setLoading] = useState(true);
  const [newRate, setNewRate] = useState<number | null>(null);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const docRef = doc(db, "configuracion", "tasaDeCambio");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setExchangeRate(docSnap.data().valor);
        }
      } catch (error) {
        console.error("Error obteniendo la tasa de cambio:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRate();
  }, [setExchangeRate]);

  const handleUpdateRate = async () => {
    if (newRate) {
      await setDoc(doc(db, "configuracion", "tasaDeCambio"), {
        valor: newRate,
      });
      setExchangeRate(newRate);
      setNewRate(null);
    }
  };

  return <div></div>;
};

export default ExchangeRate;
