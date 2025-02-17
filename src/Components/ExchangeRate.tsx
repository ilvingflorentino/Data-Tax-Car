import React, { useEffect } from "react";
import { db } from "../Services/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const ExchangeRate: React.FC<{
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
}> = ({ setExchangeRate }) => {
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
      }
    };

    fetchExchangeRate();
  }, [setExchangeRate]);

  return <div></div>;
};

export default ExchangeRate;
