import React, { useState, useEffect, ReactNode } from "react";
import { Button, Input, Table, Card, InputNumber, Select } from "antd";
import type { TableColumnsType } from "antd";
interface DataType {
  ValorVehiculo: number;
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
  const [marbeteValue, setMarbeteValue] = useState<number>(50.41); // Siempre en RD$
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

    const CalculoTotalDgii = totalDgii;
    const Total = total_regimen + totalDgii;
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
      Marbete: `RD$ ${marbete.toFixed(2)}`, // ✅ Se mantiene en RD$
      CalculoTotalDgii: formatCurrency(CalculoTotalDgii, "DOP"),
      Total: formatCurrency(Total * exchangeRate, "DOP"),
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

      {selectedVehicles.length > 0 && (
        <Card
          title="Resultados de los cálculos"
          style={{
            marginTop: "16px",
            padding: "20px",
            background: "#ffffff",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          }}
        >
          {selectedVehicles.map((vehicle, index) => {
            return (
              <div
                key={index}
                style={{
                  marginBottom: "30px",
                  padding: "20px",
                  background: "#f9f9f9",
                  borderRadius: "8px",
                }}
              >
                <p>
                  <b>
                    <h2
                      style={{
                        textAlign: "center",
                        marginBottom: "15px",
                        color: "#333",
                      }}
                    >
                      {vehicle.Marca} {vehicle.Modelo} ({vehicle.Año}) -{" "}
                      {vehicle.Pais}
                    </h2>
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
                    <h3 style={{ marginBottom: "10px", color: "#555" }}>
                      Tasa
                    </h3>
                    <div>
                      RD${" "}
                      <InputNumber
                        value={exchangeRate}
                        onChange={(value) => setExchangeRate(value ?? 0)}
                      />
                    </div>
                    <div style={{ marginBottom: "16px", marginTop: "10px" }}>
                      <Button
                        type="primary"
                        style={{ marginLeft: "12px" }}
                        onClick={refe}
                      >
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
                  </div>

                  {/* Contenedor de Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "20px",
                    }}
                  >
                    {/* Columna Izquierda */}
                    <div>
                      <Card
                        hoverable
                        style={{ padding: "20px", background: "#fdfdfd" }}
                      >
                        <h4 style={{ color: "#444" }}>Precios</h4>

                        <p>
                          <b>Valor FOB:</b> RD${" "}
                          {formatCurrency(vehicle.Valor * exchangeRate, "DOP")}
                          <InputNumber
                            value={vehicle.Valor}
                            onChange={(newValue) => {
                              if (newValue !== null) {
                                updateFOB(vehicle.key, newValue);
                                setSelectedVehicles((prevVehicles) =>
                                  prevVehicles.map((v) =>
                                    v.key === vehicle.key
                                      ? { ...v, ValorVehiculo: newValue }
                                      : v
                                  )
                                );
                              }
                            }}
                          />
                        </p>
                        <p>
                          <b>Seguro:</b> RD${" "}
                          {formatCurrency(vehicle.Seguro * exchangeRate, "DOP")}{" "}
                          <InputNumber
                            value={vehicle.Seguro}
                            onChange={(newValue) => {
                              if (newValue !== null) {
                                updateSeguro(vehicle.key, newValue);
                              }
                            }}
                          />
                        </p>
                        <p>
                          <b>Flete:</b> RD${" "}
                          {formatCurrency(vehicle.Flete * exchangeRate, "DOP")}{" "}
                          <InputNumber
                            value={vehicle.Flete}
                            onChange={(newValue) => {
                              if (newValue !== null) {
                                updateFlete(vehicle.key, newValue);
                              }
                            }}
                          />
                        </p>

                        <hr />
                        <p>
                          <b>Total CIF:</b> RD${" "}
                          {formatCurrency(
                            ((vehicle.Valor || 0) +
                              (vehicle.Seguro ?? vehicle.Valor * 0.02) +
                              (vehicle.Flete ?? 800) +
                              350) *
                              exchangeRate,
                            "DOP"
                          )}{" "}
                          / USD{" "}
                          {formatCurrency(
                            (vehicle.Valor || 0) +
                              (vehicle.Seguro ?? vehicle.Valor * 0.02) +
                              (vehicle.Flete ?? 800) +
                              350,
                            "USD"
                          )}
                        </p>
                      </Card>
                    </div>

                    {/* Columna Derecha */}
                    <div>
                      <Card
                        hoverable
                        style={{ padding: "20px", background: "#fdfdfd" }}
                      >
                        <h4 style={{ color: "#444" }}>Aduanas</h4>
                        <p>
                          <b>Gravamen:</b> {calculateTaxes(vehicle).Gravamen}
                        </p>
                        <p>
                          <b>ITBIS:</b> {calculateTaxes(vehicle).ITBIS}
                        </p>
                        <p>
                          <b>Servicio Aduanero:</b> RD${" "}
                          <InputNumber
                            value={servicioAduaneroValue}
                            onChange={(newValue) => {
                              if (newValue !== null) {
                                setServicioAduaneroValue(newValue);
                              }
                            }}
                          />
                        </p>
                        <hr />
                        <p>
                          <b>Total Aduanero:</b> RD${" "}
                          {formatCurrency(
                            parseFloat(
                              calculateTaxes(vehicle).Total_regimen.replace(
                                /[^0-9.-]+/g,
                                ""
                              )
                            ) + servicioAduaneroValue,
                            "DOP"
                          )}
                        </p>
                      </Card>
                    </div>

                    {/* Parte Inferior Izquierda */}
                    <div>
                      <Card
                        hoverable
                        style={{ padding: "20px", background: "#fdfdfd" }}
                      >
                        <h4 style={{ color: "#444" }}>Otros Impuestos</h4>
                        <p>
                          <b>CO2:</b> {calculateTaxes(vehicle).Co2}
                        </p>
                        <p>
                          <b>Placa:</b> {calculateTaxes(vehicle).Placa}
                        </p>
                        <p>
                          <b>Marbete:</b> RD${" "}
                          <InputNumber
                            value={marbeteValue}
                            onChange={(newValue) =>
                              setMarbeteValue(newValue ?? 0)
                            }
                          />
                        </p>
                        <hr />
                        <p>
                          <b>Total DGII:</b> RD${" "}
                          {formatCurrency(
                            parseFloat(
                              calculateTaxes(vehicle).totalDgii.replace(
                                /[^0-9.-]+/g,
                                ""
                              )
                            ) * exchangeRate,
                            "DOP"
                          )}
                        </p>
                      </Card>
                    </div>

                    {/* Parte Inferior Derecha */}
                    <div>
                      <Card
                        hoverable
                        style={{ padding: "20px", background: "#fdfdfd" }}
                      >
                        <h4 style={{ color: "#444" }}>Declaración Final</h4>
                        <p>
                          <b>Total Aduanas:</b>{" "}
                          {formatCurrency(
                            parseFloat(
                              calculateTaxes(vehicle).Total_regimen.replace(
                                /[^0-9.-]+/g,
                                ""
                              )
                            ) + servicioAduaneroValue,
                            "DOP"
                          )}
                        </p>
                        <p>
                          <b>Total DGII:</b>{" "}
                          {formatCurrency(
                            parseFloat(
                              calculateTaxes(vehicle).totalDgii.replace(
                                /[^0-9.-]+/g,
                                ""
                              )
                            ) * exchangeRate,
                            "DOP"
                          )}
                        </p>

                        <p>
                          <b>Valor Vehículo:</b> RD${" "}
                          {formatCurrency(
                            (vehicle.ValorVehiculo ?? vehicle.Valor) *
                              exchangeRate,
                            "DOP"
                          )}
                          <InputNumber
                            style={{ width: "150px", marginLeft: "10px" }}
                            value={vehicle.ValorVehiculo ?? vehicle.Valor} // Si no hay ValorVehiculo, usa FOB
                            placeholder="Valor Adicional"
                            onChange={(newValue) => {
                              if (newValue !== null) {
                                setSelectedVehicles((prevVehicles) =>
                                  prevVehicles.map((v) =>
                                    v.key === vehicle.key
                                      ? { ...v, ValorVehiculo: newValue } // SOLO cambia ValorVehiculo
                                      : v
                                  )
                                );
                              }
                            }}
                          />
                        </p>
                        <hr></hr>
                        <p>
                          <b>Total + Impuestos</b>
                          <span
                            style={{ marginLeft: "10px", fontWeight: "bold" }}
                          >
                            RD${" "}
                            {formatCurrency(
                              parseFloat(
                                calculateTaxes(
                                  selectedVehicles[0]
                                ).Total.replace(/[^0-9.-]+/g, "")
                              ) || 0 * exchangeRate,
                              "DOP"
                            )}
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
