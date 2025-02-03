import React, { useState, useEffect, ReactNode } from "react";
import { Button, Input, Table, Card, InputNumber, Select } from "antd";
import type { TableColumnsType } from "antd";
interface DataType {
  Flete: number;
  Seguro: number;
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
  const [marbeteValue, setMarbeteValue] = useState<number>(50.41); // Marbete editable
  const [servicioAduaneroValue, setServicioAduaneroValue] =
    useState<number>(8756.31); // Servicio Aduanero editable

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

  useEffect(() => {
    setSelectedVehicles((prevVehicles) =>
      prevVehicles.map((vehicle) => ({
        ...vehicle,
        Seguro: vehicle.Seguro ?? vehicle.Valor * 0.02, // Valor predeterminado si no está definido
        Flete: vehicle.Flete ?? 800, // Valor predeterminado si no está definido
      }))
    );
  }, [selectedRowKeys]);

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

  const updateSeguro = (vehicleKey: React.Key, newValue: number) => {
    setSelectedVehicles((prevVehicles) => {
      return prevVehicles.map((vehicle) =>
        vehicle.key === vehicleKey
          ? { ...vehicle, Seguro: newValue ?? vehicle.Valor * 0.02 }
          : vehicle
      );
    });
  };

  const updateFlete = (vehicleKey: React.Key, newValue: number) => {
    setSelectedVehicles((prevVehicles) => {
      return prevVehicles.map((vehicle) =>
        vehicle.key === vehicleKey
          ? { ...vehicle, Flete: newValue ?? 800 }
          : vehicle
      );
    });
  };
  const calculateTaxes = (vehicle: DataType) => {
    const fob = vehicle.Valor;
    const seguro = vehicle.Seguro ?? fob * 0.02;
    const flete = vehicle.Flete ?? 800;
    const otros = 350.0;
    const cif_total = fob + seguro + flete + otros;

    // Conversión de CIF a RD$
    const cifRD = cif_total * exchangeRate;

    // Gravamen dinámico
    const gravamen =
      vehicle.Pais.toUpperCase() === "ESTADOS UNIDOS"
        ? 0
        : cif_total * gravamenRate;

    // ITBIS
    const itbis = (cif_total + gravamen) * 0.18;

    // CO2
    const co2 = cif_total * co2Rate;

    // Placa
    const placa = cif_total * 0.17;

    const marbete = marbeteValue;
    // Total DGII

    const totalDgii = co2 + placa + marbeteValue; // Marbete ya está en RD$

    // Servicio Aduanero ya está en RD$
    const total_regimen = gravamen + itbis;
    const totalAduanas = total_regimen + servicioAduaneroValue;

    // Total de impuestos en RD$
    const totalImpuestos = totalAduanas + totalDgii + cifRD;
    return {
      FOB: formatCurrency(fob * exchangeRate, "DOP"),
      CIF: formatCurrency(cifRD, "DOP"),
      Seguro: formatCurrency(seguro * exchangeRate, "DOP"),
      Flete: formatCurrency(flete * exchangeRate, "DOP"),
      Otros: formatCurrency(otros * exchangeRate, "DOP"),
      Gravamen: formatCurrency(gravamen * exchangeRate, "DOP"),
      ITBIS: formatCurrency(itbis * exchangeRate, "DOP"),
      Total_regimen: formatCurrency(total_regimen * exchangeRate, "DOP"),
      Co2: formatCurrency(co2 * exchangeRate, "DOP"),
      Placa: formatCurrency(placa * exchangeRate, "DOP"),
      servicioAduanero: formatCurrency(servicioAduaneroValue, "DOP"),
      cifRD: formatCurrency(cifRD, "DOP"),
      totalAduanas: formatCurrency(totalAduanas, "DOP"),
      totalDgii: formatCurrency(totalDgii, "DOP"),
      totalImpuestos: formatCurrency(totalImpuestos, "DOP"),
      Marbete: formatCurrency(marbete, "DOP"), // ✅ Se mantiene en RD$
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
      </div>

      {selectedVehicles.length > 0 && (
        <Card title="Resultados de los cálculos" style={{ marginTop: "16px" }}>
          {selectedVehicles.map((vehicle, index) => {
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

                        <p>
                          <b>Valor Declarado FOB:</b>
                          <span
                            style={{ marginLeft: "5px", fontWeight: "bold" }}
                          >
                            RD${" "}
                            {formatCurrency(
                              (vehicle.Valor || 0) * exchangeRate,
                              "DOP"
                            )}
                          </span>
                          <InputNumber
                            value={vehicle.Valor || 0}
                            onChange={(newValue) => {
                              if (newValue !== null) {
                                updateFOB(vehicle.key, newValue);
                              }
                            }}
                            style={{ marginLeft: "10px" }}
                          />
                        </p>

                        <p>
                          <b>Seguro:</b>
                          <span
                            style={{ marginLeft: "10px", fontWeight: "bold" }}
                          >
                            RD${" "}
                            {formatCurrency(
                              (vehicle.Seguro ?? vehicle.Valor * 0.02) *
                                exchangeRate,
                              "DOP"
                            )}
                          </span>
                          <InputNumber
                            value={vehicle.Seguro ?? vehicle.Valor * 0.02}
                            onChange={(newValue) => {
                              if (newValue !== null) {
                                updateSeguro(vehicle.key, newValue);
                              }
                            }}
                            style={{ marginLeft: "10px" }}
                          />
                        </p>

                        <p>
                          <b>Flete:</b>
                          <span
                            style={{ marginLeft: "10px", fontWeight: "bold" }}
                          >
                            RD${" "}
                            {formatCurrency(
                              (vehicle.Flete ?? 800) * exchangeRate,
                              "DOP"
                            )}
                          </span>
                          <InputNumber
                            value={vehicle.Flete ?? 800}
                            onChange={(newValue) => {
                              if (newValue !== null) {
                                updateFlete(vehicle.key, newValue);
                              }
                            }}
                            style={{ marginLeft: "10px" }}
                          />
                        </p>

                        <hr />
                        <p>
                          <b>Total CIF:</b>
                          <span
                            style={{
                              marginLeft: "10px",
                              fontWeight: "bold",
                              fontSize: "18px",
                            }}
                          >
                            RD${" "}
                            {formatCurrency(
                              ((vehicle.Valor || 0) +
                                (vehicle.Seguro ?? vehicle.Valor * 0.02) +
                                (vehicle.Flete ?? 800) +
                                350) *
                                exchangeRate,
                              "DOP"
                            )}
                          </span>
                        </p>
                      </Card>
                    </div>

                    {/* Columna Derecha */}
                    <div>
                      <Card hoverable style={{ padding: "16px" }}>
                        <h4>Aduanas</h4>
                        {/* Gravamen */}
                        <p>
                          <b>Gravamen:</b>
                          <span
                            style={{ marginLeft: "10px", fontWeight: "bold" }}
                          >
                            {calculateTaxes(selectedVehicles[0]).Gravamen}
                          </span>
                        </p>

                        {/* ITBIS */}
                        <p>
                          <b>ITBIS:</b>
                          <span
                            style={{ marginLeft: "10px", fontWeight: "bold" }}
                          >
                            {calculateTaxes(selectedVehicles[0]).ITBIS}
                          </span>
                        </p>

                        <p>
                          <b>Servicio Aduanero:</b>
                          <span
                            style={{ marginLeft: "10px", fontWeight: "bold" }}
                          >
                            RD$
                          </span>
                          <InputNumber
                            value={servicioAduaneroValue}
                            onChange={(newValue) => {
                              if (newValue !== null) {
                                setServicioAduaneroValue(newValue);
                              }
                            }}
                            min={0}
                            style={{ marginLeft: "10px", width: "120px" }}
                          />
                        </p>
                        <hr />
                        <p>
                          <b>Total Aduanero:</b>
                          <span
                            style={{ marginLeft: "10px", fontWeight: "bold" }}
                          >
                            RD${" "}
                            {formatCurrency(
                              (parseFloat(
                                calculateTaxes(
                                  selectedVehicles[0]
                                ).Total_regimen.replace(/[^0-9.-]+/g, "")
                              ) || 0) + servicioAduaneroValue,
                              "DOP"
                            )}
                          </span>
                        </p>
                      </Card>
                    </div>

                    {/* Parte Inferior Izquierda */}
                    <div>
                      <Card hoverable style={{ padding: "16px" }}>
                        <h4>Otros Impuestos</h4>
                        <p>
                          <b>CO2:</b>
                          <span
                            style={{ marginLeft: "10px", fontWeight: "bold" }}
                          >
                            {calculateTaxes(selectedVehicles[0]).Co2}
                          </span>
                        </p>

                        <p>
                          <b>Placa:</b>
                          <span
                            style={{ marginLeft: "10px", fontWeight: "bold" }}
                          >
                            {calculateTaxes(selectedVehicles[0]).Placa}
                          </span>
                          <p />
                          <p>
                            <b>Marbete:</b>
                            <span
                              style={{ marginLeft: "10px", fontWeight: "bold" }}
                            >
                              RD$
                            </span>
                            <InputNumber
                              value={marbeteValue}
                              onChange={(newValue) => {
                                if (newValue !== null) {
                                  setMarbeteValue(newValue); // ✅ Se actualiza en RD$
                                }
                              }}
                              min={0}
                              style={{ marginLeft: "10px", width: "120px" }}
                            />
                          </p>
                        </p>
                        <hr />
                        <p>
                          <b>Total DGII:</b>
                          <span
                            style={{ marginLeft: "10px", fontWeight: "bold" }}
                          >
                            RD${" "}
                            {formatCurrency(
                              (parseFloat(
                                calculateTaxes(
                                  selectedVehicles[0]
                                ).totalDgii.replace(/[^0-9.-]+/g, "")
                              ) || 0) * exchangeRate,
                              "DOP"
                            )}
                          </span>
                        </p>
                      </Card>
                    </div>

                    {/* Parte Inferior Derecha */}
                    <div>
                      <Card hoverable style={{ padding: "16px" }}>
                        <h4>Declaración Final</h4>

                        {/* Total Aduanas */}
                        <p>
                          <b>Total Aduanas:</b>
                          <span
                            style={{ marginLeft: "10px", fontWeight: "bold" }}
                          >
                            {calculateTaxes(selectedVehicles[0]).Total_regimen}
                          </span>
                        </p>

                        {/* Total DGII */}
                        <p>
                          <b>Total DGII:</b>
                          <span
                            style={{ marginLeft: "10px", fontWeight: "bold" }}
                          >
                            {calculateTaxes(selectedVehicles[0]).totalDgii}
                          </span>
                        </p>

                        {/* Total + Impuestos */}
                        <p>
                          <b>Total + Impuestos:</b>
                          <span
                            style={{
                              marginLeft: "10px",
                              fontWeight: "bold",
                              fontSize: "18px",
                            }}
                          >
                            {calculateTaxes(selectedVehicles[0]).totalImpuestos}
                          </span>
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
