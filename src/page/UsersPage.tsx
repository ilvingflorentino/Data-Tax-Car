import React, { useState, useEffect, ReactNode } from "react";
import { Button, Input, Table, Card, InputNumber, Select } from "antd";
import type { TableColumnsType } from "antd";
import "./styles.css";
import ExchangeRate from "../Components/ExchangeRate";
import { updateExchangeRate } from "../Services/updateExchangerRate";
interface DataType {
  Otros: number;
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
  const [gravamenRate, setGravamenRate] = useState<number>(0.1); // Gravamen inicial
  const [co2Rate, setCo2Rate] = useState<number>(0.01); // CO2 inicial
  const [marbeteValue, setMarbeteValue] = useState<number>(3000); // Valor fijo en RD$`
  const [servicioAduaneroValue, setServicioAduaneroValue] =
    useState<number>(8756.31); // Servicio Aduanero editable
  const [otros, setOtros] = useState(350);

  const fetchData = async () => {
    try {
      const response = await fetch("/vehicles.json"); // Ruta directa al archivo en la carpeta public

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      const filteredData = result.filter((item: any) => {
        return (
          (filters.marca
            ? item.Marca.toLowerCase().includes(filters.marca.toLowerCase())
            : true) &&
          (filters.modelo
            ? item.Modelo.toLowerCase().includes(filters.modelo.toLowerCase())
            : true) &&
          (filters.year ? item.Año.toString().includes(filters.year) : true)
        );
      });

      setData(
        filteredData.map((item: any, index: number) => ({
          key: index,
          Marca: item.Marca,
          Modelo: item.Modelo,
          Año: item.Año,
          Valor: parseFloat(item.Valor),
          Pais: item.Pais,
          Especificaciones: item.Especificaciones,
        }))
      );
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

  useEffect(() => {
    const fetchAndUpdateRate = async () => {
      const newRate = await updateExchangeRate();
      if (newRate) {
        setExchangeRate(newRate);
      }
    };

    fetchAndUpdateRate();
  }, []);

  const calculateTaxes = (vehicle: DataType) => {
    const fob = vehicle.Valor; // USD
    const seguro = vehicle.Seguro ?? fob * 0.02; // USD
    const flete = vehicle.Flete ?? 800; // USD
    const totalCIF =
      (vehicle.Valor || 0) +
      (vehicle.Seguro ?? vehicle.Valor * 0.02) +
      (vehicle.Flete ?? 800) +
      otros; // "Otros" ya está en USD, se suma directo

    // Gravamen dinámico (USD)
    const gravamen =
      vehicle.Pais.toUpperCase() === "ESTADOS UNIDOS"
        ? 0
        : totalCIF * gravamenRate;

    // ITBIS (USD)
    const itbis = (totalCIF + gravamen) * 0.18;

    // CO2 y Placa (USD)
    const co2 = totalCIF * co2Rate;
    const placa = totalCIF * 0.17;

    // Total DGII (DOP) - Marbete ya está en DOP
    const totalDgiiUSD = co2 + placa; // USD
    const totalDgiiDOP = totalDgiiUSD * exchangeRate + marbeteValue; // Convertimos CO2 y Placa a DOP y sumamos marbete

    // Total Aduanas (DOP) - Convertimos todo a DOP
    const totalAduanasDOP =
      (gravamen + itbis) * exchangeRate + servicioAduaneroValue;

    // Valor Vehículo en DOP
    const valorVehiculoDOP = (vehicle.ValorVehiculo ?? 0) * exchangeRate;

    // Total CIF en DOP
    const totalCIFDOP = totalCIF * exchangeRate;

    // Total Final (DOP)
    const TotalDOP =
      totalCIFDOP + totalAduanasDOP + totalDgiiDOP + valorVehiculoDOP;

    return {
      FOB: formatCurrency(fob * exchangeRate, "DOP"),
      CIF: formatCurrency(totalCIF * exchangeRate, "DOP"),
      Seguro: formatCurrency(seguro * exchangeRate, "DOP"),
      Flete: formatCurrency(flete * exchangeRate, "DOP"),
      Otros: formatCurrency(otros * exchangeRate, "DOP"),
      Gravamen: formatCurrency(gravamen * exchangeRate, "DOP"),
      ITBIS: formatCurrency(itbis * exchangeRate, "DOP"),
      Total_regimen: formatCurrency(totalAduanasDOP, "DOP"),
      Co2: formatCurrency(co2 * exchangeRate, "DOP"),
      Placa: formatCurrency(placa * exchangeRate, "DOP"),
      totalDgii: formatCurrency(totalDgiiDOP, "DOP"),
      Marbete: formatCurrency(marbeteValue, "DOP"),
      ValorVehiculo: formatCurrency(valorVehiculoDOP, "DOP"),
      Total: formatCurrency(TotalDOP, "DOP"),
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
    <div className="container">
      <div className="filters">
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
      <Table
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
        <Card title="Resultados de los cálculos" className="results-card">
          {selectedVehicles.map((vehicle, index) => (
            <div key={index} className="vehicle-card">
              <h2 className="vehicle-title">
                {vehicle.Marca} {vehicle.Modelo} ({vehicle.Año}) -{" "}
                {vehicle.Pais}
              </h2>
              <div className="rate-section">
                <h3>Tasa</h3>
                <ExchangeRate
                  exchangeRate={exchangeRate || 0}
                  setExchangeRate={setExchangeRate}
                />

                <div>
                  RD${" "}
                  <InputNumber
                    value={exchangeRate}
                    onChange={(value) => setExchangeRate(value ?? 0)}
                  />
                </div>
                <div className="rate-buttons">
                  <Button type="primary" onClick={refe}>
                    Empezar de Nuevo
                  </Button>
                  <Select
                    defaultValue="0.10"
                    onChange={(value) => setGravamenRate(parseFloat(value))}
                  >
                    <Select.Option value="0.0">Gravamen 0%</Select.Option>
                    <Select.Option value="0.10">Gravamen 10%</Select.Option>
                    <Select.Option value="0.20">Gravamen 20%</Select.Option>
                  </Select>
                  <Select
                    defaultValue="0.01"
                    onChange={(value) => setCo2Rate(parseFloat(value))}
                  >
                    <Select.Option value="0.01">Co2 1%</Select.Option>
                    <Select.Option value="0.02">Co2 2%</Select.Option>
                    <Select.Option value="0.03">Co2 3%</Select.Option>
                  </Select>
                </div>
              </div>

              <div className="grid-container">
                <Card className="price-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h3>Valor del Vehículo</h3>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <h4>DOP</h4>
                    </div>
                    <div style={{ textAlign: "right", paddingRight: "20px" }}>
                      <h4>USD</h4>
                    </div>
                  </div>
                  <hr />

                  <div className="grid-card">
                    {/* Valor FOB */}
                    <div className="grid-item">
                      <b>Valor Declarado FOB:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(vehicle.Valor * exchangeRate)}
                    </div>
                    <div className="grid-item">
                      <InputNumber
                        className="right-align-input"
                        value={vehicle.Valor}
                        precision={2}
                        onChange={(newValue) =>
                          updateFOB(vehicle.key, newValue ?? 0)
                        }
                        style={{ width: "120px" }}
                      />
                    </div>

                    {/* Seguro */}
                    <div className="grid-item">
                      <b>Seguro:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(vehicle.Seguro * exchangeRate)}
                    </div>
                    <div className="grid-item">
                      <InputNumber
                        className="right-align-input"
                        value={vehicle.Seguro}
                        precision={2}
                        onChange={(newValue) =>
                          updateSeguro(vehicle.key, newValue ?? 0)
                        }
                        style={{ width: "120px" }}
                      />
                    </div>

                    {/* Flete */}
                    <div className="grid-item">
                      <b>Flete:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(vehicle.Flete * exchangeRate)}
                    </div>
                    <div className="grid-item">
                      <InputNumber
                        className="right-align-input"
                        value={vehicle.Flete}
                        precision={2}
                        onChange={(newValue) =>
                          updateFlete(vehicle.key, newValue ?? 0)
                        }
                        style={{ width: "120px" }}
                      />
                    </div>

                    {/* Otros (Nuevo campo agregado correctamente) */}
                    <div className="grid-item">
                      <b>Otros:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(otros * exchangeRate)}
                    </div>
                    <div className="grid-item">
                      <InputNumber
                        className="right-align-input"
                        value={otros}
                        precision={2}
                        onChange={(newValue) => setOtros(newValue ?? 0)}
                        style={{ width: "120px" }}
                      />
                    </div>
                  </div>

                  <hr />
                  {/* Total CIF (Incluyendo Otros en la suma correctamente) */}
                  <div className="grid-card">
                    <div className="grid-item">
                      <b>Total CIF:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(
                        ((vehicle.Valor || 0) +
                          (vehicle.Seguro ?? vehicle.Valor * 0.02) +
                          (vehicle.Flete ?? 800) +
                          (otros ?? 350)) *
                          exchangeRate
                      )}
                    </div>
                    <div className="grid-item left-align-currencyUSD">
                      {formatCurrency(
                        (vehicle.Valor || 0) +
                          (vehicle.Seguro ?? vehicle.Valor * 0.02) +
                          (vehicle.Flete ?? 800) +
                          (otros ?? 350), // 🔹 Se corrigió aquí
                        "USD"
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="price-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h3>Aduanas</h3>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <h4>DOP</h4>
                    </div>
                    <div style={{ textAlign: "right", paddingRight: "20px" }}>
                      <h4>USD</h4>
                    </div>
                  </div>
                  <hr />

                  <div className="grid-card">
                    {/* Gravamen */}
                    <div className="grid-item">
                      <b>Gravamen:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(
                        parseFloat(
                          calculateTaxes(vehicle).Gravamen.replace(
                            /[^0-9.-]+/g,
                            ""
                          )
                        ) || 0
                      )}
                    </div>
                    <div className="grid-item left-align-currencyUSD">
                      {formatCurrency(
                        (parseFloat(
                          calculateTaxes(vehicle).Gravamen.replace(
                            /[^0-9.-]+/g,
                            ""
                          )
                        ) || 0) / exchangeRate
                      )}
                    </div>

                    {/* ITBIS */}
                    <div className="grid-item">
                      <b>ITBIS:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(
                        parseFloat(
                          calculateTaxes(vehicle).ITBIS.replace(
                            /[^0-9.-]+/g,
                            ""
                          )
                        ) || 0
                      )}
                    </div>
                    <div className="grid-item left-align-currencyUSD">
                      {formatCurrency(
                        (parseFloat(
                          calculateTaxes(vehicle).ITBIS.replace(
                            /[^0-9.-]+/g,
                            ""
                          )
                        ) || 0) / exchangeRate,
                        "USD"
                      )}
                    </div>
                    {/* Servicio Aduanero */}
                    <div className="grid-item">
                      <b>Servicio Aduanero:</b>
                    </div>
                    <div className="grid-item">
                      <InputNumber
                        className="right-align-input"
                        value={servicioAduaneroValue}
                        precision={2}
                        onChange={(newValue) =>
                          setServicioAduaneroValue(newValue ?? 0)
                        }
                        style={{ width: "130px" }}
                      />
                    </div>
                    <div className="grid-item left-align-currencyUSD">
                      {" "}
                      {formatCurrency(
                        servicioAduaneroValue / exchangeRate,
                        "USD"
                      )}
                    </div>
                  </div>
                  <hr />
                  <div className="grid-card">
                    <div className="grid-item">
                      <b>Total Aduanas:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(
                        parseFloat(
                          calculateTaxes(vehicle).Total_regimen.replace(
                            /[^0-9.-]+/g,
                            ""
                          )
                        ) || 0
                      )}
                    </div>
                    <div className="grid-item left-align-currencyUSD">
                      {formatCurrency(
                        (parseFloat(
                          calculateTaxes(vehicle).Total_regimen.replace(
                            /[^0-9.-]+/g,
                            ""
                          )
                        ) || 0) / exchangeRate,
                        "USD"
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="price-card">
                  <h3>Impuestos DGII</h3>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <h4>DOP</h4>
                    </div>
                    <div style={{ textAlign: "right", paddingRight: "0px" }}>
                      <h4>USD</h4>
                    </div>
                  </div>
                  <hr />

                  <div className="grid-card">
                    {/* CO2 */}
                    <div className="grid-item">
                      <b>CO2:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(
                        parseFloat(
                          calculateTaxes(vehicle).Co2.replace(/[^0-9.-]+/g, "")
                        ) || 0
                      )}
                    </div>
                    <div className="grid-item left-align-currencyUSD">
                      {formatCurrency(
                        (parseFloat(
                          calculateTaxes(vehicle).Co2.replace(/[^0-9.-]+/g, "")
                        ) || 0) / exchangeRate,
                        "USD"
                      )}
                    </div>
                    {/* Placa */}
                    <div className="grid-item">
                      <b>Placa:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(
                        parseFloat(
                          calculateTaxes(vehicle).Placa.replace(
                            /[^0-9.-]+/g,
                            ""
                          )
                        ) || 0
                      )}
                    </div>
                    <div className="grid-item left-align-currencyUSD">
                      {formatCurrency(
                        (parseFloat(
                          calculateTaxes(vehicle).Placa.replace(
                            /[^0-9.-]+/g,
                            ""
                          )
                        ) || 0) / exchangeRate,
                        "USD"
                      )}
                    </div>
                    {/* Marbete */}
                    <div className="grid-item">
                      <b>Marbete:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      <div className="grid-item">
                        <InputNumber
                          className="right-align-input"
                          value={marbeteValue}
                          precision={2}
                          onChange={(newValue) =>
                            setMarbeteValue(newValue ?? 0)
                          }
                          style={{ width: "130px" }}
                        />
                      </div>
                    </div>

                    <div className="grid-item left-align-currencyUSD">
                      {" "}
                      {formatCurrency(marbeteValue / exchangeRate, "USD")}
                    </div>
                  </div>
                  <hr />
                  <div className="grid-card">
                    <div className="grid-item">
                      <b>Total DGII:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(
                        parseFloat(
                          calculateTaxes(vehicle).totalDgii.replace(
                            /[^0-9.-]+/g,
                            ""
                          )
                        ) || 0
                      )}
                    </div>
                    <div className="grid-item left-align-currencyUSD">
                      {formatCurrency(
                        (parseFloat(
                          calculateTaxes(vehicle).totalDgii.replace(
                            /[^0-9.-]+/g,
                            ""
                          )
                        ) || 0) / exchangeRate,
                        "USD"
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="price-card">
                  <h3>Costo Dinal del Vehículo</h3>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <h4>DOP</h4>
                    </div>
                    <div style={{ textAlign: "right", paddingRight: "0px" }}>
                      <h4>USD</h4>
                    </div>
                  </div>
                  <hr />

                  <div className="grid-card">
                    {/* Total Aduanas */}
                    <div className="grid-item">
                      <b>Total Aduanas:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(
                        parseFloat(
                          calculateTaxes(vehicle).Total_regimen.replace(
                            /[^0-9.-]+/g,
                            ""
                          )
                        ) || 0
                      )}
                    </div>
                    <div className="grid-item left-align-currencyUSD">
                      {formatCurrency(
                        (parseFloat(
                          calculateTaxes(vehicle).Total_regimen.replace(
                            /[^0-9.-]+/g,
                            ""
                          )
                        ) || 0) / exchangeRate,
                        "USD"
                      )}
                    </div>

                    {/* Total DGII */}
                    <div className="grid-item">
                      <b>Total DGII:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(
                        parseFloat(
                          calculateTaxes(vehicle).totalDgii.replace(
                            /[^0-9.-]+/g,
                            ""
                          )
                        ) || 0
                      )}
                    </div>
                    <div className="grid-item left-align-currencyUSD">
                      {formatCurrency(
                        (parseFloat(
                          calculateTaxes(vehicle).totalDgii.replace(
                            /[^0-9.-]+/g,
                            ""
                          )
                        ) || 0) / exchangeRate,
                        "USD"
                      )}
                    </div>
                  </div>
                  {/* Valor Vehículo */}
                  <div className="grid-card">
                    {/* 🔹 Valor del Vehículo (Inicialmente es el Total CIF) */}
                    <div className="grid-item">
                      <b>Valor del Vehículo:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(
                        (vehicle.ValorVehiculo ?? vehicle.Valor) * exchangeRate
                      )}
                    </div>
                    <div className="grid-item">
                      <InputNumber
                        className="right-align-input"
                        value={vehicle.ValorVehiculo ?? vehicle.Valor}
                        precision={2}
                        onChange={(newValue) =>
                          setSelectedVehicles((prevVehicles) =>
                            prevVehicles.map((v) =>
                              v.key === vehicle.key
                                ? { ...v, ValorVehiculo: newValue ?? 0 }
                                : v
                            )
                          )
                        }
                        style={{ width: "120px" }}
                      />
                    </div>
                  </div>

                  <hr />

                  <div className="grid-card">
                    <div className="grid-item">
                      <b>Total + Impuestos:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(
                        parseFloat(
                          calculateTaxes(vehicle).Total.replace(
                            /[^0-9.-]+/g,
                            ""
                          )
                        ) || 0
                      )}
                    </div>
                    <div className="grid-item left-align-currencyUSD">
                      {formatCurrency(
                        (parseFloat(
                          calculateTaxes(vehicle).Total.replace(
                            /[^0-9.-]+/g,
                            ""
                          )
                        ) || 0) / exchangeRate,
                        "USD"
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default App;
