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
  const [exchangeRate, setExchangeRate] = useState<number>(59.54);
  const [gravamenRate, setGravamenRate] = useState<number>(0.1);
  const [co2Rate, setCo2Rate] = useState<number>(0.01);
  const [marbeteValue, setMarbeteValue] = useState<number>(3000);
  const [servicioAduaneroValue, setServicioAduaneroValue] =
    useState<number>(8756.31);
  const [otros, setOtros] = useState<number>(0);
  const [seguroFleteOtros, setSeguroFleteOtros] = useState<number | null>(null);
  const [originalVehicles, setOriginalVehicles] = useState<DataType[]>([]);
  const handleRowSelection = (newSelectedRowKeys: React.Key[]) => {
    if (
      selectedRowKeys.length > 0 &&
      newSelectedRowKeys[0] === selectedRowKeys[0]
    ) {
      setSelectedRowKeys([]);
      setSelectedVehicles([]);
      setOriginalVehicles([]); // Resetea los valores originales también
    } else {
      const selected = data.filter((item) =>
        newSelectedRowKeys.includes(item.key)
      );
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedVehicles(selected);
      setOriginalVehicles(selected); // Guarda la versión original de los valores
    }
  };
  const resetFields = () => {
    setSeguroFleteOtros(null);
    setMarbeteValue(3000);
    setServicioAduaneroValue(8756.31);
    setOtros(0);
    setSelectedVehicles((prevVehicles) =>
      prevVehicles.map((vehicle) => {
        const originalVehicle = originalVehicles.find(
          (v) => v.key === vehicle.key
        );
        return {
          ...vehicle,
          Valor: originalVehicle?.Valor ?? vehicle.Valor, // Restaura el valor original del FOB
          Seguro:
            originalVehicle?.Valor !== undefined
              ? originalVehicle.Valor * 0.02
              : vehicle.Seguro, // Seguro basado en FOB
          Flete: 800,
          ValorVehiculo: originalVehicle?.Valor ?? vehicle.Valor, // También reseteamos el valor del vehículo
        };
      })
    );
  };
  const fetchData = async () => {
    try {
      const response = await fetch("/vehicles.json");
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
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
      // valor que sea esta en tabla almaceno ese fob en una variable y luego se muestra cuando se resete el campo.
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
    setSelectedVehicles((prevVehicles) =>
      prevVehicles.map((vehicle) => ({
        ...vehicle,
        Seguro: vehicle.Seguro ?? vehicle.Valor * 0.02,
        Flete: vehicle.Flete ?? 800,
      }))
    );
  }, [selectedRowKeys]);

  const formatCurrency = (value: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  };

  const refe = () => window.location.reload();

  const updateFOB = (vehicleKey: React.Key, newValue: number) => {
    setSelectedVehicles((prevVehicles) =>
      prevVehicles.map((vehicle) =>
        vehicle.key === vehicleKey
          ? {
              ...vehicle,
              Valor: newValue, // ✅ Actualiza el FOB
              ValorVehiculo: newValue, // ✅ También actualiza el Valor del Vehículo
            }
          : vehicle
      )
    );
  };

  const updateSeguro = (vehicleKey: React.Key, newValue: number) => {
    setSelectedVehicles((prevVehicles) =>
      prevVehicles.map((vehicle) =>
        vehicle.key === vehicleKey
          ? { ...vehicle, Seguro: newValue ?? vehicle.Valor * 0.02 }
          : vehicle
      )
    );
  };

  const updateFlete = (vehicleKey: React.Key, newValue: number) => {
    setSelectedVehicles((prevVehicles) =>
      prevVehicles.map((vehicle) =>
        vehicle.key === vehicleKey
          ? { ...vehicle, Flete: newValue ?? 800 }
          : vehicle
      )
    );
  };

  useEffect(() => {
    const fetchAndUpdateRate = async () => {
      const newRate = await updateExchangeRate();
      if (newRate) setExchangeRate(newRate);
    };
    fetchAndUpdateRate();
  }, []);

  const calculateTaxes = (vehicle: DataType) => {
    const fob = vehicle.Valor; // USD

    // Usar el valor de seguroFleteOtros si está definido, de lo contrario calcularlo automáticamente
    const seguroFleteOtrosValue =
      seguroFleteOtros !== null
        ? seguroFleteOtros
        : (vehicle.Seguro ?? fob * 0.02) + (vehicle.Flete ?? 800) + otros;

    // Si el valor del vehículo fue editado, usamos ese valor directamente
    const valorVehiculo = vehicle.ValorVehiculo ?? fob;

    // Calcular el Total CIF
    const totalCIF = fob + seguroFleteOtrosValue;

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
    const totalDgiiDOP = totalDgiiUSD * exchangeRate + marbeteValue; // Convertimos a DOP y sumamos Marbete

    // Total Aduanas (DOP) - Convertimos todo a DOP
    const totalAduanasDOP =
      (gravamen + itbis) * exchangeRate + servicioAduaneroValue;

    // Valor Vehículo en DOP
    const valorVehiculoDOP = valorVehiculo * exchangeRate;

    // Total Final (DOP)
    const TotalDOP =
      totalAduanasDOP +
      totalDgiiDOP +
      seguroFleteOtrosValue * exchangeRate +
      valorVehiculoDOP;

    return {
      FOB: formatCurrency(fob * exchangeRate, "DOP"),
      CIF: formatCurrency(totalCIF * exchangeRate, "DOP"),
      Seguro: formatCurrency(
        (vehicle.Seguro ?? fob * 0.02) * exchangeRate,
        "DOP"
      ),
      Flete: formatCurrency((vehicle.Flete ?? 800) * exchangeRate, "DOP"),
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
    { title: "Marca", dataIndex: "Marca", key: "Marca" },
    { title: "Modelo", dataIndex: "Modelo", key: "Modelo" },
    { title: "Año", dataIndex: "Año", key: "Año" },
    { title: "Valor", dataIndex: "Valor", key: "Valor" },
    { title: "Pais", dataIndex: "Pais", key: "Pais" },
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
      <div className="scrollable-container">
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: handleRowSelection,
            type: "checkbox",
          }}
          columns={columns}
          dataSource={data}
        />
      </div>

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
                  <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <Button type="primary" onClick={resetFields}>
                      Resetear Campos
                    </Button>
                  </div>
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
                      {formatCurrency(
                        (vehicle.Valor || 0) * exchangeRate,
                        "DOP"
                      )}
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
                      {formatCurrency(
                        (vehicle.Seguro || vehicle.Valor * 0.02) * exchangeRate, // Asegurar que sea un número válido
                        "DOP"
                      )}
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
                  <div className="grid-card">
                    <div className="grid-item">
                      <b>Total CIF:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(
                        (vehicle.Valor +
                          (vehicle.Seguro ?? vehicle.Valor * 0.02) +
                          (vehicle.Flete ?? 800) +
                          otros) *
                          exchangeRate
                      )}
                    </div>
                    <div className="grid-item left-align-currencyUSD">
                      {formatCurrency(
                        vehicle.Valor +
                          (vehicle.Seguro ?? vehicle.Valor * 0.02) +
                          (vehicle.Flete ?? 800) +
                          otros,
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

                    <div className="grid-item">
                      <b>Marbete:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      <InputNumber
                        className="right-align-input"
                        value={marbeteValue}
                        precision={2}
                        onChange={(newValue) => setMarbeteValue(newValue ?? 0)}
                        style={{ width: "130px" }}
                      />
                    </div>
                    <div className="grid-item left-align-currencyUSD">
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
                  <h3>Costo Final del Vehículo</h3>
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
                  <div className="grid-card">
                    <div className="grid-item">
                      <b>Seguro + Flete + Otros:</b>
                    </div>
                    <div className="grid-item center-currencyDOP">
                      {formatCurrency(
                        (seguroFleteOtros !== null
                          ? seguroFleteOtros
                          : (vehicle.Seguro || 0) +
                            (vehicle.Flete || 0) +
                            otros) * exchangeRate
                      )}
                    </div>
                    <div className="grid-item">
                      <InputNumber
                        className="right-align-input"
                        value={
                          seguroFleteOtros !== null
                            ? seguroFleteOtros
                            : (vehicle.Seguro || 0) +
                              (vehicle.Flete || 0) +
                              otros
                        }
                        precision={2}
                        onChange={(newValue) =>
                          setSeguroFleteOtros(newValue ?? 0)
                        }
                        style={{ width: "120px" }}
                      />
                    </div>
                  </div>
                  <div className="grid-card">
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
                        onChange={(newValue) => {
                          setSelectedVehicles((prevVehicles) =>
                            prevVehicles.map((v) =>
                              v.key === vehicle.key
                                ? {
                                    ...v,
                                    ValorVehiculo:
                                      newValue !== null &&
                                      newValue !== undefined
                                        ? newValue
                                        : vehicle.ValorVehiculo ??
                                          vehicle.Valor,
                                  }
                                : v
                            )
                          );
                        }}
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
