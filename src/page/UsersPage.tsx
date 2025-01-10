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
  const [exchangeRate, setExchangeRate] = useState<number>(59.54); // Tasa de cambio inicial
  const [isEditing, setIsEditing] = useState(false);
  const [isUSD, setIsUSD] = useState(true); // Controla si mostrar en USD o DOP

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
    const seguro = fob * 0.02;
    const flete = 800.0;
    const otros = 350.0;
    const cif_total = fob + seguro + flete + otros;
    const cifRD = cif_total / 2;

    const gravamen =
      vehicle.Pais.toUpperCase() === "ESTADOS UNIDOS" ? 0 : cif_total * 0.1;
    const itbis = (cif_total + gravamen) * 0.18;
    const total_regimen = gravamen + itbis;
    const co2 = cif_total * 0.01;
    const placa = cif_total * 0.17;

    // Tasa Servicio Aduanero fija
    const tasaServicioAduaneroDOP = 8756.31; // Siempre en RD$

    // Convertir a USD si es necesario
    const tasaServicioAduanero = isUSD
      ? tasaServicioAduaneroDOP / exchangeRate // Convertir a dólares
      : tasaServicioAduaneroDOP; // Mantener en pesos

    // Declaración Aduanas fija en RD$
    const declaracionAduanasDOP = 258.26; // Siempre en RD$

    // Convertir a USD si es necesario
    const declaracionAduanas = isUSD
      ? declaracionAduanasDOP / exchangeRate
      : declaracionAduanasDOP;

    // Aduanero Total
    const aduaneroTotal = tasaServicioAduanero + declaracionAduanas;

    // Moneda seleccionada
    const rate = isUSD ? 1 : exchangeRate;
    const currency = isUSD ? "USD" : "DOP";

    return {
      FOB: formatCurrency(fob * rate, currency),
      CIF: formatCurrency(cif_total * rate, currency),
      Seguro: formatCurrency(seguro * rate, currency),
      Flete: formatCurrency(flete * rate, currency),
      Otros: formatCurrency(otros * rate, currency),
      Gravamen: formatCurrency(gravamen * rate, currency),
      ITBIS: formatCurrency(itbis * rate, currency),
      Total_regimen: formatCurrency(total_regimen * rate, currency),
      Co2: formatCurrency(co2 * rate, currency),
      Placa: formatCurrency(placa * rate, currency),
      servicioAduanero: formatCurrency(tasaServicioAduanero),
      cifRD: formatCurrency(cifRD * rate, currency),
      DeclaracionAduanas: formatCurrency(declaracionAduanas, "DOP"), // Siempre en DOP
      Aduanero: formatCurrency(aduaneroTotal, currency),
    };
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
      <div style={{ marginBottom: "16px", display: "flex", gap: "10px" }}></div>
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

      <Table<DataType>
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data}
      />
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
        <Button type="primary" style={{ marginLeft: "12px" }} onClick={refe}>
          Valores Anteriores
        </Button>
        <Button
          style={{ marginLeft: "12px" }}
          type="primary"
          onClick={() => setIsUSD(!isUSD)}
        >
          {isUSD ? "Calcular en Pesos Dominicanos" : "Calcular en Dólares"}
        </Button>
      </div>

      {selectedVehicles.length > 0 && (
        <Card title="Resultados de los cálculos" style={{ marginTop: "16px" }}>
          {selectedVehicles.map((vehicle, index) => {
            const taxes = calculateTaxes(vehicle);
            return (
              <div key={index}>
                <p>
                  <b>
                    {vehicle.Marca} {vehicle.Modelo} ({vehicle.Año}) -{" "}
                    {vehicle.Pais}
                  </b>
                </p>
                <p>Total FOB {taxes.FOB}</p>
                <p>Seguro: {taxes.Seguro}</p>
                <p>Flete: {taxes.Flete}</p>
                <p>Otros: {taxes.Otros}</p>
                <p>Total CIF : {taxes.CIF}</p>
                <p>Total Monto Liberado del CIF:{taxes.cifRD}</p>
                <p>Gravamen: {taxes.Gravamen}</p>
                <p>ITBIS: {taxes.ITBIS}</p>
                <p>Total Imp. y Regimen a Pagar: {taxes.Total_regimen}</p>
                <p>CO2: {taxes.Co2}</p>
                <p>Placa: {taxes.Placa}</p>
                <p>Tasa Servicio Aduanero: {taxes.servicioAduanero}</p>
                <p>Declaración Unica Aduanera: {taxes.DeclaracionAduanas}</p>
                <p>Aduanero Total: {taxes.Aduanero}</p>
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
