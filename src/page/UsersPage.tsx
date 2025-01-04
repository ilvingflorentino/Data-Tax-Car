import { useState, useEffect } from "react";
import { Select } from "antd";
import type { SelectProps } from "antd";
import "./styles.css";

export const UsersPage = () => {
  const [data, setData] = useState([]);

  
  const options: SelectProps["options"] = [];
  for (let i = 10; i < 36; i++) {
    options.push({
      value: i.toString(36) + i,
      label: i.toString(36) + i,
    });
  }

  const reqApi = async () => {
    try {
      const api = await fetch("https://reqres.in/api/users?page=2");
      const response = await api.json();
      setData(response.data); // Actualiza el estado con los datos obtenidos
      console.log(response.data); // Muestra los datos en consola
    } catch (error) {
      console.error("Error fetching the data:", error);
    }
  };

  const handleChange = (value: string) => {
    console.log(`selected ${value}`);
  };

  // Llama a la API al cargar el componente
  useEffect(() => {
    reqApi();
  }, []);

  return (
    <div className="container">
      <h1>Data Tax Car 2024-2025</h1>

      <hr />
      <div className="filters">
        <Select
          mode="tags"
          style={{ width: "20%" }}
          onChange={handleChange}
          tokenSeparators={[","]}
          options={options}
        />
        <Select
          mode="tags"
          style={{ width: "20%" }}
          onChange={handleChange}
          tokenSeparators={[","]}
          options={options}
        />
        <Select
          mode="tags"
          style={{ width: "20%" }}
          onChange={handleChange}
          tokenSeparators={[","]}
          options={options}
        />
      </div>
    </div>
  );
};
