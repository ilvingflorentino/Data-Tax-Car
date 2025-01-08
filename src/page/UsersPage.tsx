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
    const fob = vehicle.Valor;
    const cif = fob / 2;
    const seguro = fob * 0.02;
    const flete = fob * 0.03; // Ejemplo: 3% del FOB
    const otros = fob * 0.01; // Ejemplo: 1% del FOB

    // Gravamen: 20% del CIF (si no es de EE.UU.)
    const gravamen =
      vehicle.Pais.toUpperCase() === "ESTADOS UNIDOS" ? 0 : cif * 0.2;

    // ITBIS: 18% del CIF + Gravamen
    const itbis = (fob + gravamen) * 0.18;
    // CO2: 1% del CIF
    const Co2 = fob * 0.01;
    // Marbete: Valor fijo (RD$3,000)
    const marbete = 3000;
    // Total de Régimen: Gravamen + ITBIS
    const Total_regimen = gravamen + itbis;
    const placa = fob * 0.17;
    return {
      FOB: formatCurrency(fob),
      Cif: formatCurrency(cif),
      Gravamen: formatCurrency(gravamen),
      ITBIS: formatCurrency(itbis),
      Co2: formatCurrency(Co2),
      Placa: formatCurrency(placa),
      Marbete: formatCurrency(marbete),
      Total_regimen: formatCurrency(Total_regimen),
      Seguro: formatCurrency(seguro),
      Flete: formatCurrency(flete),
      Otros: formatCurrency(otros),
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
                <p>Gravamen {taxes.Gravamen}</p>
                <p>CIF {taxes.Cif}</p>
                <p>Marbete {taxes.Marbete}</p>
                <p>itbis {taxes.ITBIS}</p>
                <p>Total Imp. y Regimen a Pagar: {taxes.Total_regimen}</p>
                <p>Co2 {taxes.Co2}</p>
                <p>Placa {taxes.Placa}</p>

                <br></br>
                <p>seguro {taxes.Seguro}</p>
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
