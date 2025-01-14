import React, { useState, useEffect, ReactNode } from "react";
import { Button, Input, Table, Card, InputNumber, Select } from "antd";
import type { TableColumnsType } from "antd";
interface DataType {
  title: ReactNode;
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
  const [isUSD, setIsUSD] = useState(true); // Controla si mostrar en USD o DOP
  const [gravamenRate, setGravamenRate] = useState<number>(0.1); // Gravamen inicial
  const [co2Rate, setCo2Rate] = useState<number>(0.01); // CO2 inicial

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

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    // Recalcular automáticamente cuando cambien las tasas seleccionadas
    setSelectedVehicles((prevVehicles) => [...prevVehicles]);
  }, [gravamenRate, co2Rate]);

  const formatCurrency = (value: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  };

  function refe() {
    window.location.reload();
  }
  const updateFOB = (vehicleKey: React.Key, newValue: number) => {
    setSelectedVehicles((prevVehicles) =>
      prevVehicles.map((vehicle) =>
        vehicle.key === vehicleKey ? { ...vehicle, Valor: newValue } : vehicle
      )
    );
  };

  const calculateTaxes = (vehicle: DataType) => {
    const fob = vehicle.Valor;
    const seguro = fob * 0.02;
    const flete = 800.0;
    const otros = 350.0;
    const cif_total = fob + seguro + flete + otros;
    const cifRD = cif_total / 2;

    // Gravamen dinámico (0 si es de EE.UU.)
    const gravamen =
      vehicle.Pais.toUpperCase() === "ESTADOS UNIDOS"
        ? 0
        : cif_total * gravamenRate;

    // ITBIS
    const itbis = (cif_total + gravamen) * 0.18;

    // Total Régimen
    const total_regimen = gravamen + itbis;

    // CO2 dinámico
    const co2 = cif_total * co2Rate;
    //marbete
    const marbete = 3000;
    // Placa
    const placa = cif_total * 0.17;

    // Tasa Servicio Aduanero fija
    const tasaServicioAduaneroDOP = 8756.31; // Siempre en RD$

    // Convertir a USD si es necesario
    const tasaServicioAduanero = isUSD
      ? tasaServicioAduaneroDOP / exchangeRate // Convertir a dólares
      : tasaServicioAduaneroDOP; // Mantener en pesos

    // Declaración Aduanas fija en RD$
    const declaracionAduanasDOP = 258.26; // Siempre en RD$

    // Convertir a USD si es necesarios
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
      marbete: formatCurrency(marbete, currency),
    };
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
      <Table<DataType>
        rowSelection={{
          selectedRowKeys,
          onChange: (newSelectedRowKeys) => {
            if (
              selectedRowKeys.length > 0 &&
              newSelectedRowKeys[0] === selectedRowKeys[0]
            ) {
              setSelectedRowKeys([]);
              setSelectedVehicles([]);
            } else {
              setSelectedRowKeys(newSelectedRowKeys);
              const selected = data.filter((item) =>
                newSelectedRowKeys.includes(item.key)
              );
              setSelectedVehicles(selected);
            }
          },
          type: "checkbox",
        }}
        columns={columns}
        dataSource={data}
      />

      <div style={{ marginBottom: "16px" }}>
        <Button type="primary" style={{ marginLeft: "12px" }} onClick={refe}>
          Valores Por Defectos.
        </Button>

        <Select
          style={{ width: 150, marginLeft: "12px" }}
          defaultValue="0.10"
          onChange={(value) => setGravamenRate(parseFloat(value))}
        >
          <Select.Option value="0.10">Gravamen 10%</Select.Option>
          <Select.Option value="0.20">Gravamen 20%</Select.Option>
          <Select.Option value="0.30">Gravamen 30%</Select.Option>
        </Select>

        <Select
          style={{ width: 150, marginLeft: "10px" }}
          defaultValue="0.01"
          onChange={(value) => setCo2Rate(parseFloat(value))}
        >
          <Select.Option value="0.01">Co2 1%</Select.Option>
          <Select.Option value="0.02">Co2 2%</Select.Option>
          <Select.Option value="0.03">Co2 3%</Select.Option>
        </Select>
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
                    <h1>
                      {vehicle.Marca} {vehicle.Modelo} ({vehicle.Año}) -{" "}
                      {vehicle.Pais}
                    </h1>
                  </b>
                </p>
                <div
                  style={{
                    padding: "16px",
                    background: "#f0f2f5",
                    borderRadius: "10px",
                  }}
                >
                  {/* Tasa */}
                  <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <h3>Tasa</h3>
                    <div>
                      RD${" "}
                      <InputNumber
                        value={exchangeRate}
                        onChange={(value) => setExchangeRate(value ?? 0)}
                      />
                    </div>
                  </div>

                  {/* Contenedor de Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "20px",
                      maxWidth: "1200px",
                      margin: "0 auto",
                    }}
                  >
                    {/* Columna Izquierda */}
                    <div>
                      <Card hoverable style={{ padding: "16px" }}>
                        <h4>Precio</h4>
                        <p>Valor Declarado FOB</p>
                        <InputNumber
                          value={selectedVehicles[0]?.Valor || 0}
                          onChange={(newValue) => {
                            if (newValue !== null) {
                              updateFOB(selectedVehicles[0]?.key, newValue);
                            }
                          }}
                        />
                        <p>
                          Seguro: {calculateTaxes(selectedVehicles[0]).Seguro}
                        </p>
                        <p>
                          Flete: {calculateTaxes(selectedVehicles[0]).Flete}
                        </p>
                        <hr />
                        <p>
                          Total CIF: {calculateTaxes(selectedVehicles[0]).CIF}
                        </p>
                      </Card>
                    </div>

                    {/* Columna Derecha */}
                    <div>
                      <Card hoverable style={{ padding: "16px" }}>
                        <h4>Total Aduanas</h4>
                        <p>
                          Gravamen:{" "}
                          {calculateTaxes(selectedVehicles[0]).Gravamen}
                        </p>
                        <p>
                          ITBIS: {calculateTaxes(selectedVehicles[0]).ITBIS}
                        </p>
                        <p>
                          Servicio Aduanero:{" "}
                          {calculateTaxes(selectedVehicles[0]).servicioAduanero}
                        </p>
                        <hr />
                        <p>
                          Total Aduanas:{" "}
                          {calculateTaxes(selectedVehicles[0]).Aduanero}
                        </p>
                      </Card>
                    </div>

                    {/* Parte Inferior Izquierda */}
                    <div>
                      <Card hoverable style={{ padding: "16px" }}>
                        <h4>Otros Impuestos</h4>
                        <p>CO2: {calculateTaxes(selectedVehicles[0]).Co2}</p>
                        <p>
                          Placa: {calculateTaxes(selectedVehicles[0]).Placa}
                        </p>
                        <p>
                          Marbete: {calculateTaxes(selectedVehicles[0]).marbete}
                        </p>
                        <hr />
                        <p>
                          Total DGII:{" "}
                          {calculateTaxes(selectedVehicles[0]).Total_regimen}
                        </p>
                      </Card>
                    </div>

                    {/* Parte Inferior Derecha */}
                    <div>
                      <Card hoverable style={{ padding: "16px" }}>
                        <h4>Declaración Final</h4>
                        <p>
                          Total Imp. y Régimen a Pagar:{" "}
                          {calculateTaxes(selectedVehicles[0]).Total_regimen}
                        </p>
                        <p>
                          Total Monto Liberado del CIF:{" "}
                          {calculateTaxes(selectedVehicles[0]).cifRD}
                        </p>
                        <hr />
                        <p>
                          Declaración Aduanera:{" "}
                          {
                            calculateTaxes(selectedVehicles[0])
                              .DeclaracionAduanas
                          }
                        </p>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
};
export default App;
