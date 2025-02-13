import { getFirestore, doc, setDoc } from "firebase/firestore";

const db = getFirestore();
import axios from "axios";

export const updateExchangeRate = async () => {
  try {
    const response = await axios.get(
      "https://www.infodolar.com.do/api/getExchangeRate"
    );

    if (!response.data || !response.data.venta) {
      throw new Error("No se pudo obtener la tasa de cambio.");
    }

    const tasaVenta = response.data.venta;

    await setDoc(doc(db, "configuracion", "tasaDeCambio"), {
      valor: tasaVenta,
      fechaActualizacion: new Date().toISOString(),
    });

    console.log("✅ Tasa de cambio actualizada:", tasaVenta);
    return tasaVenta;
  } catch (error) {
    console.error("❌ Error al obtener la tasa de cambio:", error);
    return <script>Tasa De Dolar no Encontrada.;</script>;
  }
};
