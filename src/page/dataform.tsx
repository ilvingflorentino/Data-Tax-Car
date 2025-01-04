import React, { useState } from "react";
import { Button, Flex, Table } from "antd";
import type { TableColumnsType, TableProps } from "antd";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

interface DataType {
  key: React.Key;
  Marca: string;
  Modelo: string;
  Valor: string;
  Pais: string;
  Especificaciones: string;
}

const columns: TableColumnsType<DataType> = [
  { title: "Marca", dataIndex: "Marca" },
  { title: "Modelo", dataIndex: "Modelo" },
  { title: "Valor", dataIndex: "Valor" },
  { title: "Pais", dataIndex: "Pais" },
  { title: "Especificaciones", dataIndex: "Especificaciones" },
];

const dataSource = Array.from<DataType>({ length: 46 }).map<DataType>(
  (_, i) => ({
    key: i,
    Marca: `Marca ${i}`,
    Modelo: `Modelo ${i}`,
    Valor: `Valor ${i}`,
    Pais: `Pais ${i}`,
    Especificaciones: `Especificaciones ${i}`,
  })
);

const App: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(false);

  const start = () => {
    setLoading(true);
    setTimeout(() => {
      setSelectedRowKeys([]);
      setLoading(false);
    }, 1000);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<DataType> = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const hasSelected = selectedRowKeys.length > 0;

  return (
    <Flex gap="middle" vertical>
      <Flex align="center" gap="middle">
        <Button
          type="primary"
          onClick={start}
          disabled={!hasSelected}
          loading={loading}
        >
          Calcular impuestos
        </Button>
        {hasSelected
          ? `Vehiculos ${selectedRowKeys.length} Seleccionados`
          : null}
      </Flex>
      <Table<DataType>
        rowSelection={rowSelection}
        columns={columns}
        dataSource={dataSource}
      />
    </Flex>
  );
};

export default App;
