import React, { useState, useEffect } from "react";
import { Button, Input, Table } from "antd";
import type { TableColumnsType, TableProps } from "antd";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

interface DataType {
  key: React.Key;
  Marca: string;
  Modelo: string;
  Valor: string;
  Pais: string;
  Año: number;
  Especificaciones: string;
}

const columns: TableColumnsType<DataType> = [
  { title: "Marca", dataIndex: "Marca" },
  { title: "Modelo", dataIndex: "Modelo" },
  { title: "Año", dataIndex: "Año" },
  { title: "Valor", dataIndex: "Valor" },
  { title: "Pais", dataIndex: "Pais" },
  { title: "Especificaciones", dataIndex: "Especificaciones" },
];

const App: React.FC = () => {
  const [data, setData] = useState<DataType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({ marca: "", modelo: "", year: "" }); // Cambié "Año" a "year"

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
            Valor: item.Valor,
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

  const start = () => {
    setLoading(true);
    setTimeout(() => {
      setSelectedRowKeys([]);
      setLoading(false);
    }, 1000);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<DataType> = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const hasSelected = selectedRowKeys.length > 0;

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
          value={filters.year} // Cambié "Año" a "year"
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, year: e.target.value }))
          }
        />
      </div>
      <div style={{ marginBottom: "16px" }}>
        <Button
          type="primary"
          onClick={start}
          disabled={!hasSelected}
          loading={loading}
        >
          Calcular impuestos
        </Button>
        {hasSelected ? (
          <span style={{ marginLeft: "8px" }}>
            Vehículos seleccionados: {selectedRowKeys.length}
          </span>
        ) : null}
      </div>
      <Table<DataType>
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data}
      />
    </div>
  );
};

export default App;
