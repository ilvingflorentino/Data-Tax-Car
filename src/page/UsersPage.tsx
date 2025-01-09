import React, { useState, useEffect } from "react";
import { Button, Input, Table, Card, InputNumber } from "antd";
import type { TableColumnsType, TableProps } from "antd";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

interface DataType {
  key: React.Key;
  Marca: string;
  Modelo: string;
  Valor: number;
  Pais: string;
  Año: number;
  Especificaciones: string;
}

const App: React.FC = () => {
  const [data, setData] = useState<DataType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<DataType[]>([]);
  const [filters, setFilters] = useState({ marca: "", modelo: "", year: "" });
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams(
        Object.entries(filters).filter(([_, value]) => value.trim() !== "")
      );
      const response = await fetch(`http://localhost:3000/vehicles?${params}`);
      const result = await response.json();
      if (result.success) {
        setData(
          result.data.map((item: any, index: number) => ({
            key: index,
            Marca: item.Marca,
            Modelo: item.Modelo,
            Año: item.Año,
            Valor: parseFloat(item.Valor),
            Pais: item.Pais,
            Especificaciones: item.Especificaciones,
          }))
        );
      } else {
        console.error("Error: No se obtuvieron los vehículos.");
      }
    } catch (error) {
      console.error("Error en la petición de vehículos:", error);
    }
  };

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch("http://localhost:3000/exchange-rate");
      const result = await response.json();
      if (result.success && result.rate) {
        setExchangeRate(result.rate);
      } else {
        console.error("Error: No se obtuvo una tasa de cambio válida.");
      }
    } catch (error) {
      console.error("Error obteniendo la tasa de cambio:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchExchangeRate();
  }, [filters]);

  const formatCurrency = (value: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  };

  const updateVehicleValue = (key: React.Key, newValue: number) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.key === key ? { ...item, Valor: newValue } : item
      )
    );
  };

  function refe() {
    window.location.reload();
  }
  const calculateTaxes = (vehicle: DataType) => {
    const fob = vehicle.Valor; // Valor FOB del vehículo.

    // Seguro: $85.40 (valor fijo en el reporte)
    const seguro = 85.4;

    // Flete: $800.00 (valor fijo en el reporte)
    const flete = 800.0;

    // Otros: $350.00 (valor fijo en el reporte)
    const otros = 350.0;

    // CIF dolares: FOB + Seguro + Flete + Otros
    const cif_total = fob + seguro + flete + otros;
    //Sacando mitad del fob da el CIF
    const cifRd = cif_total / 2;
    const resul = cifRd * 59.54;
    // Gravamen: 20% del CIF
    const isFromUSA = vehicle.Pais.toUpperCase() === "ESTADOS UNIDOS";
    const gravamen = isFromUSA ? 0.0 : cifRd * 0.2;
    const resul1 = gravamen * 59.54;
    // ITBIS: 18% de (CIF + Gravamen)
    const itbis = (cif_total + gravamen) * 0.18;
    const resul2 = itbis * 59.54;
    // CO2: $3,277.83 (1% del CIF total, confirmado en la hoja)

    const co2 = gravamen * 0.01;

    // Formateo del CO2 a dólares
    const formattedCo2 = co2.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
    const recoverCo2 = Number(co2);

    const resul3 = co2 * 59.54; // Tasa de cambio
    const formattedResul3 = resul3.toLocaleString("en-US", {
      style: "currency",
      currency: "DOP",
    });
    // Placa: 17% del CIF
    const placa = cif_total * 0.17;
    const resul5 = placa * 59.54;
    //Simplemente al número le haces esto:
    //const result = resul3.toLocaleString();

    // Marbete: RD$3,000.00 (valor fijo)
    const marbete = 3000.0;

    // Total de Impuestos y Régimen a Pagar: Gravamen + ITBIS
    const total_regimen = gravamen + itbis;
    const resul4 = total_regimen * 59.54;

    // Balance a pagar por servicio aduanero: Tasa Servicio Aduanero ($8,756.31) + Declaración Única Aduanera ($258.26)
    const tasa_servicio_aduanero = 8756.31;
    const declaracion_unica_aduanera = 258.26;
    const balance_servicio_aduanero =
      tasa_servicio_aduanero + declaracion_unica_aduanera;

    return {
      FOB: formatCurrency(fob),
      CIF: formatCurrency(cif_total),
      Seguro: formatCurrency(seguro),
      Flete: formatCurrency(flete),
      Otros: formatCurrency(otros),
      Gravamen: formatCurrency(gravamen),
      ITBIS: formatCurrency(itbis),
      Co2: formattedCo2, // Formateado como USD
      Co2EnPesos: formattedResul3, // Formateado como DOP
      Placa: formatCurrency(placa),
      Marbete: formatCurrency(marbete),
      Total_regimen: formatCurrency(total_regimen),
      Tasa_Servicio_Aduanero: formatCurrency(tasa_servicio_aduanero),
      Declaracion_Unica_Aduanera: formatCurrency(declaracion_unica_aduanera),
      Balance_Servicio_Aduanero: formatCurrency(balance_servicio_aduanero),
      cifRd: formatCurrency(cifRd),
      result: formatCurrency(resul),
      result1: formatCurrency(resul1),
      result2: formatCurrency(resul2),
      result3: formatCurrency(resul3),
      result4: formatCurrency(resul4),
      resul5: formatCurrency(resul5),
    };
  };

  const calculatePriceInDOP = (priceInUSD: number) => {
    if (exchangeRate === 0) return "Tasa de cambio no disponible";
    return formatCurrency(priceInUSD * exchangeRate, "DOP");
  };

  const clearSelection = () => {
    setSelectedRowKeys([]);
    setSelectedVehicles([]);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
    const selected = data.filter((item) =>
      newSelectedRowKeys.includes(item.key)
    );
    setSelectedVehicles(selected);
  };

  const rowSelection: TableRowSelection<DataType> = {
    selectedRowKeys,
    onChange: onSelectChange,
    type: "radio",
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: "Marca",
      dataIndex: "Marca",
      key: "Marca",
    },
    {
      title: "Modelo",
      dataIndex: "Modelo",
      key: "Modelo",
    },
    {
      title: "Año",
      dataIndex: "Año",
      key: "Año",
    },
    {
      title: "Valor",
      dataIndex: "Valor",
      key: "Valor",
      render: (value: number, record: DataType) => (
        <InputNumber
          value={value}
          onChange={(newValue) =>
            updateVehicleValue(record.key, newValue as number)
          }
          disabled={!isEditing}
          formatter={(value) =>
            value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
          }
          parser={(value) => parseFloat(value?.replace(/,/g, "") || "0")}
        />
      ),
    },
    {
      title: "Pais",
      dataIndex: "Pais",
      key: "Pais",
    },
    {
      title: "Especificaciones",
      dataIndex: "Especificaciones",
      key: "Especificaciones",
    },
  ];

  return (
    <div
      style={{ padding: "16px", background: "#85858e", borderRadius: "10px" }}
    >
      <div style={{ marginBottom: "16px", display: "flex", gap: "10px" }}>
        <Input
          placeholder="Buscar por Marca"
          value={filters.marca}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, marca: e.target.value }))
          }
        />
        <Input
          placeholder="Buscar por Modelo"
          value={filters.modelo}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, modelo: e.target.value }))
          }
        />
        <Input
          placeholder="Buscar por Año"
          value={filters.year}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, year: e.target.value }))
          }
        />
      </div>
      <div style={{ marginBottom: "16px" }}>
        <Button type="primary" onClick={clearSelection}>
          Limpiar resultados
        </Button>
        <Button
          type="primary"
          style={{ marginLeft: "10px" }}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Aceptar" : "Editar Precios"}
        </Button>
        <Button type="primary" style={{ marginLeft: "10px" }} onClick={refe}>
          Valores Anteriores
        </Button>
      </div>
      <Table<DataType>
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data}
      />
      {selectedVehicles.length > 0 && (
        <Card title="Resultados de los cálculos" style={{ marginTop: "16px" }}>
          {selectedVehicles.map((vehicle, index) => {
            const taxes = calculateTaxes(vehicle);
            const priceInDOP = calculatePriceInDOP(taxes.TotalGeneral);
            return (
              <div key={index}>
                <p>
                  <b>
                    {vehicle.Marca} {vehicle.Modelo} ({vehicle.Año}) -{" "}
                    {vehicle.Pais}
                  </b>
                </p>

                <p>Fob {taxes.FOB}</p>
                <p>seguro {taxes.Seguro}</p>
                <p>Marbete {taxes.Marbete}</p>
                <p>Placa {taxes.resul5}</p>
                <p>Flete {taxes.Flete}</p>
                <p>otros {taxes.Otros}</p>
                <p>CIF US {taxes.CIF}</p>
                <p>CIF RD {taxes.result}</p>
                <p>Gravamen {taxes.result1}</p>
                <p>itbis {taxes.result2}</p>
                <p>Total Imp. y Regimen a Pagar: {taxes.result4}</p>
                <br></br>
                <p>Co2 {taxes.Co2EnPesos}</p>
                <p>
                  <b>Precio en DOP: {priceInDOP}</b>
                </p>
                <hr />
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
};

export default App;
