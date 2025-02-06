import React, { useState, useEffect, ReactNode } from "react";
import { Button, Input, Table, Card, InputNumber, Select } from "antd";
import type { TableColumnsType } from "antd";
import "./styles.css";
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
  const [marbeteValue, setMarbeteValue] = useState<number>(3000); // Valor fijo en RD$
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
    const fob = vehicle.Valor; // USD
    const seguro = vehicle.Seguro ?? fob * 0.02; // USD
    const flete = vehicle.Flete ?? 800; // USD
    const otros = 350.0; // USD
    const cif_total = fob + seguro + flete + otros; // USD

    // Gravamen dinámico (USD)
    const gravamen =
      vehicle.Pais.toUpperCase() === "ESTADOS UNIDOS"
        ? 0
        : cif_total * gravamenRate;

    // ITBIS (USD)
    const itbis = (cif_total + gravamen) * 0.18;

    // CO2 y Placa (USD)
    const co2 = cif_total * co2Rate;
    const placa = cif_total * 0.17;

    // Total DGII (DOP) - Marbete ya está en DOP
    const totalDgiiUSD = co2 + placa; // USD
    const totalDgiiDOP = totalDgiiUSD * exchangeRate + marbeteValue; // Convertimos CO2 y Placa a DOP y sumamos marbete

    // Total Aduanas (DOP) - Convertimos todo a DOP
    const total_regimenDOP =
      (gravamen + itbis) * exchangeRate + servicioAduaneroValue;

    // Valor Vehículo en DOP
    const valorVehiculoDOP =
      (vehicle.ValorVehiculo ?? vehicle.Valor) * exchangeRate;

    // Total Final (DOP)
    const TotalDOP = total_regimenDOP + totalDgiiDOP + valorVehiculoDOP;

    return {
      FOB: formatCurrency(fob * exchangeRate, "DOP"),
      CIF: formatCurrency(cif_total * exchangeRate, "DOP"),
      Seguro: formatCurrency(seguro * exchangeRate, "DOP"),
      Flete: formatCurrency(flete * exchangeRate, "DOP"),
      Otros: formatCurrency(otros * exchangeRate, "DOP"),
      Gravamen: formatCurrency(gravamen * exchangeRate, "DOP"),
      ITBIS: formatCurrency(itbis * exchangeRate, "DOP"),
      Total_regimen: formatCurrency(total_regimenDOP, "DOP"),
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
                <div>
                  RD${" "}
                  <InputNumber
                    value={exchangeRate}
                    onChange={(value) => setExchangeRate(value ?? 0)}
                  />
                </div>
                <div className="rate-buttons">
                  <Button type="primary" onClick={refe}>
                    Valores Por Defecto
                  </Button>
                  <Select
                    defaultValue="0.10"
                    onChange={(value) => setGravamenRate(parseFloat(value))}
                  >
                    <Select.Option value="0.10">Gravamen 10%</Select.Option>
                    <Select.Option value="0.20">Gravamen 20%</Select.Option>
                    <Select.Option value="0.30">Gravamen 30%</Select.Option>
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
                  <h4>Precios</h4>
                  <p>
                    <b>Valor Declarado FOB:</b>

                    {formatCurrency(vehicle.Valor * exchangeRate, "DOP")}

                    <InputNumber
                      value={vehicle.Valor}
                      onChange={(newValue) =>
                        updateFOB(vehicle.key, newValue ?? 0)
                      }
                      style={{ marginLeft: "10px", width: "120px" }}
                    />
                  </p>

                  <p>
                    <b>Seguro:</b>{" "}
                    {formatCurrency(vehicle.Seguro * exchangeRate, "DOP")}{" "}
                    <InputNumber
                      value={vehicle.Seguro}
                      onChange={(newValue) =>
                        updateSeguro(vehicle.key, newValue ?? 0)
                      }
                    />
                  </p>
                  <p>
                    <b>Flete:</b>{" "}
                    {formatCurrency(vehicle.Flete * exchangeRate, "DOP")}{" "}
                    <InputNumber
                      value={vehicle.Flete}
                      onChange={(newValue) =>
                        updateFlete(vehicle.key, newValue ?? 0)
                      }
                    />
                  </p>
                  <hr />
                  <p>
                    <b>Total CIF:</b>{" "}
                    {formatCurrency(
                      ((vehicle.Valor || 0) +
                        (vehicle.Seguro ?? vehicle.Valor * 0.02) +
                        (vehicle.Flete ?? 800) +
                        350) *
                        exchangeRate,
                      "DOP"
                    )}{" "}
                    /{" "}
                    {formatCurrency(
                      (vehicle.Valor || 0) +
                        (vehicle.Seguro ?? vehicle.Valor * 0.02) +
                        (vehicle.Flete ?? 800) +
                        350,
                      "USD"
                    )}
                  </p>
                </Card>

                <Card className="customs-card">
                  <h4>Aduanas</h4>
                  <p>
                    <b>Gravamen:</b> {calculateTaxes(vehicle).Gravamen}
                  </p>
                  <p>
                    <b>ITBIS:</b> {calculateTaxes(vehicle).ITBIS}
                  </p>
                  <p>
                    <b>Servicio Aduanero:</b>{" "}
                    <InputNumber
                      value={servicioAduaneroValue}
                      onChange={(newValue) =>
                        setServicioAduaneroValue(newValue ?? 0)
                      }
                    />
                  </p>
                  <hr />
                  <p>
                    <b>Total Aduanas:</b>{" "}
                    {calculateTaxes(vehicle).Total_regimen}
                  </p>
                </Card>

                <Card className="taxes-card">
                  <h4>Otros Impuestos</h4>
                  <p>
                    <b>CO2:</b> {calculateTaxes(vehicle).Co2}
                  </p>
                  <p>
                    <b>Placa:</b> {calculateTaxes(vehicle).Placa}
                  </p>
                  <p>
                    <b>Marbete:</b> {formatCurrency(marbeteValue, "DOP")}{" "}
                    <InputNumber
                      value={marbeteValue}
                      onChange={(newValue) => setMarbeteValue(newValue ?? 0)}
                    />
                  </p>
                  <hr />
                  <p>
                    <b>Total DGII:</b> {calculateTaxes(vehicle).totalDgii}
                  </p>
                </Card>

                <Card className="final-declaration-card">
                  <h4>Declaración Final</h4>
                  <p>
                    <b>Total Aduanas:</b>{" "}
                    {calculateTaxes(vehicle).Total_regimen}
                  </p>
                  <p>
                    <b>Total DGII:</b> {calculateTaxes(vehicle).totalDgii}
                  </p>
                  <p>
                    <b>Valor Vehículo:</b>{" "}
                    {formatCurrency(
                      (vehicle.ValorVehiculo ?? vehicle.Valor) * exchangeRate,
                      "DOP"
                    )}{" "}
                    <InputNumber
                      value={vehicle.ValorVehiculo ?? vehicle.Valor}
                      onChange={(newValue) =>
                        setSelectedVehicles((prevVehicles) =>
                          prevVehicles.map((v) =>
                            v.key === vehicle.key
                              ? { ...v, ValorVehiculo: newValue ?? 0 }
                              : v
                          )
                        )
                      }
                    />
                  </p>
                  <hr />
                  <p>
                    <b>Total + Impuestos:</b> {calculateTaxes(vehicle).Total}
                  </p>
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
