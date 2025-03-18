import React, { useState, useEffect, ReactNode } from "react";
import {
  Button,
  Input,
  Table,
  Card,
  InputNumber,
  Select,
  Pagination,
} from "antd";
import type { TableColumnsType } from "antd";
import "./styles.css";
import ExchangeRate from "../Components/ExchangeRate";
import { updateExchangeRate } from "../Services/updateExchangerRate";
import { db } from "../Services/firebaseConfig";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

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
  const [filteredData, setFilteredData] = useState<DataType[]>([]);
  //const [lastDoc, setLastDoc] = useState<any>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const handleRowSelection = (newSelectedRowKeys: React.Key[]) => {
    const selected = data.filter((item) =>
      newSelectedRowKeys.includes(item.key)
    );
    setSelectedRowKeys(newSelectedRowKeys);
    setSelectedVehicles(selected);
  };

  const resetFields = () => {
    setSelectedVehicles(
      data.map((vehicle) => ({
        ...vehicle,
        Seguro: vehicle.Valor * 0.02, // Recalcula el seguro
        Flete: 800,
        ValorVehiculo: vehicle.Valor,
      }))
    );
  };

  const getPaginatedData = (
    data: DataType[],
    currentPage: number,
    pageSize: number
  ) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  };

  const normalizeText = (text: string) => {
    return text.trim().toLowerCase().replace(/\s+/g, " ");
  };

  const isValidFilter = (value: string) => {
    return value.trim().length >= 3;
  };
  const applyFilters = (
    vehicles: DataType[],
    filters: { marca: string; modelo: string; year: string }
  ) => {
    return vehicles.filter((vehicle) => {
      const normalizedMarca = normalizeText(vehicle.Marca);
      const normalizedModelo = normalizeText(vehicle.Modelo);
      const searchMarca = normalizeText(filters.marca);
      const searchModelo = normalizeText(filters.modelo);

      // Aplicar filtro de marca solo si tiene al menos 3 letras
      const matchesMarca = filters.marca
        ? isValidFilter(filters.marca) && normalizedMarca.includes(searchMarca)
        : true;

      // Aplicar filtro de modelo solo si tiene al menos 3 letras
      const matchesModelo = filters.modelo
        ? isValidFilter(filters.modelo) &&
          normalizedModelo.includes(searchModelo)
        : true;

      // Aplicar filtro de año sin restricción de longitud
      const matchesYear = filters.year
        ? vehicle.Año === parseInt(filters.year)
        : true;

      return matchesMarca && matchesModelo && matchesYear;
    });
  };

  const fetchVehicles = async (_p0: boolean) => {
    try {
      const q = query(collection(db, "vehiculos"), orderBy("Año", "desc"));
      const querySnapshot = await getDocs(q);

      const vehicles = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          key: doc.id,
          Otros: data.Otros ?? 0,
          ValorVehiculo: data.ValorVehiculo ?? 0,
          Flete: data.Flete ?? 0,
          Seguro: data.Seguro ?? 0,
          title: data.title ?? "",
          Marca: data.Marca ?? "",
          Modelo: data.Modelo ?? "",
          Valor: data.Valor ?? 0,
          Pais: data.Pais || data.País || "No especificado",
          Año: data.Año ?? 0,
          Especificaciones: data.Especificaciones ?? "",
        };
      });

      const filteredVehicles = applyFilters(vehicles, filters);
      setFilteredData(filteredVehicles);
      const paginatedData = getPaginatedData(
        filteredVehicles,
        currentPage,
        pageSize
      );
      setData(paginatedData);
    } catch (error) {
      console.error("Error al obtener los vehículos:", error);
    } finally {
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Resetear a la primera página
    fetchVehicles(true); // Recargar datos con los nuevos filtros
  }, [filters.marca, filters.modelo, filters.year]);

  useEffect(() => {
    // Verificar si los filtros tienen al menos 3 letras
    const isMarcaValid = !filters.marca || isValidFilter(filters.marca);
    const isModeloValid = !filters.modelo || isValidFilter(filters.modelo);

    if (isMarcaValid && isModeloValid) {
      setCurrentPage(1); // Resetear a la primera página
      fetchVehicles(true); // Recargar datos con los nuevos filtros
    }
  }, [filters.marca, filters.modelo, filters.year]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchVehicles(true); // Resetear paginación y aplicar filtros
    }, 300); // Retraso de 300ms para evitar múltiples llamadas

    return () => clearTimeout(delaySearch); // Limpiar el timeout si el usuario sigue escribiendo
  }, [filters.marca, filters.modelo, filters.year]);

  useEffect(() => {
    fetchVehicles(false); // Cargar datos cuando cambia la página o el tamaño de la página
  }, [currentPage, pageSize]);

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
    {
      title: "Valor",
      dataIndex: "Valor",
      key: "Valor",
      render: (value: number) => formatCurrency(value, "USD"), // Formatear como moneda
    },
    { title: "Pais", dataIndex: "Pais", key: "Pais" },
    {
      title: "Especificaciones",
      dataIndex: "Especificaciones",
      key: "Especificaciones",
    },
  ];
  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) {
      setPageSize(pageSize);
    }
    const paginatedData = getPaginatedData(filteredData, page, pageSize || 10);
    setData(paginatedData);
  };

  return (
    <div className="container">
      <div className="filters">
        <Input
          placeholder="Buscar por Marca"
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, marca: e.target.value }))
          }
        />
        <Input
          placeholder="Buscar por Modelo"
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, modelo: e.target.value }))
          }
        />
        <Input
          placeholder="Buscar por Año"
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, year: e.target.value }))
          }
        />
      </div>
      <div className="scrollable-container">
        <Table<DataType>
          rowSelection={{
            selectedRowKeys,
            onChange: handleRowSelection,
            type: "checkbox",
          }}
          columns={columns}
          dataSource={data}
          pagination={false}
        />
        <Pagination
          align="end"
          current={currentPage}
          pageSize={pageSize}
          total={filteredData.length}
          onChange={handlePageChange}
          showSizeChanger
          pageSizeOptions={["10", "20", "50", "100"]}
        />
      </div>
      {selectedVehicles.length > 0 && (
        <Card title="Resultados de los cálculos" className="results-card">
          {selectedVehicles.map((vehicle) => (
            <div key={vehicle.key} className="vehicle-card">
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
                    controls={false}
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
                        controls={false}
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
                        controls={false}
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
                        controls={false}
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
                        controls={false}
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
                        controls={false}
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
                        controls={false}
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
                        controls={false}
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
                        controls={false}
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
