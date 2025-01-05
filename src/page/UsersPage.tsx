import React, { useState, useEffect } from "react";
import { Button, Input, Table, Card } from "antd";
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

const columns: TableColumnsType<DataType> = [
  { title: "Marca", dataIndex: "Marca" },
  { title: "Modelo", dataIndex: "Modelo" },
  { title: "Año", dataIndex: "Año" },
  {
    title: "Valor",
    dataIndex: "Valor",
    render: (value: number) => new Intl.NumberFormat("en-US").format(value),
  },
  { title: "Pais", dataIndex: "Pais" },
  { title: "Especificaciones", dataIndex: "Especificaciones" },
];

const App: React.FC = () => {
  const [data, setData] = useState<DataType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<DataType[]>([]);
  const [filters, setFilters] = useState({ marca: "", modelo: "", year: "" });

  const fetchData = async () => {
    try {
      const params = new URLSearchParams(filters);
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
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const calculateTaxes = (vehicle: DataType) => {
    const placa = vehicle.Valor * 0.17;
    const co2 = vehicle.Valor * 0.02;
    const itbis = vehicle.Valor * 0.18;
    const gravamen = vehicle.Valor * 0.2;
    const totalParcial = gravamen + itbis + co2;
    const totalGeneral = totalParcial + placa;

    return {
      Placa: formatCurrency(placa),
      CO2: formatCurrency(co2),
      ITBIS: formatCurrency(itbis),
      Gravamen: formatCurrency(gravamen),
      TotalParcial: formatCurrency(totalParcial),
      TotalGeneral: formatCurrency(totalGeneral),
    };
  };

  const clearSelection = () => {
    // Limpia la selección y los resultados
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
  };

  return (
    <div style={{ padding: "16px" }}>
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
        <Button
          type="primary"
          onClick={clearSelection} // Siempre limpia los resultados
        >
          Limpiar resultados
        </Button>
        {selectedRowKeys.length > 0 && (
          <span style={{ marginLeft: "8px" }}>
            Vehículos seleccionados: {selectedRowKeys.length}
          </span>
        )}
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
            return (
              <div key={index}>
                <p>
                  <b>
                    {vehicle.Marca} {vehicle.Modelo} ({vehicle.Año})
                  </b>
                </p>
                <p>Total Parcial: US {taxes.TotalParcial} </p>
                <p>Total General: US {taxes.TotalGeneral} </p>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
};

export default App;
