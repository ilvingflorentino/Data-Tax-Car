import { useState, useEffect } from "react";
import { Pagination, Select } from "antd";
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
          style={{ width: "30%" }}
          onChange={handleChange}
          tokenSeparators={[","]}
          options={options}
        />
        <Select
          mode="tags"
          style={{ width: "30%" }}
          onChange={handleChange}
          tokenSeparators={[","]}
          options={options}
        />
        <Select
          mode="tags"
          style={{ width: "30%" }}
          onChange={handleChange}
          tokenSeparators={[","]}
          options={options}
        />
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Valor</th>
              <th>Pais</th>
              <th>Especificaciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>{`${user.first_name} ${user.last_name}`}</td>
                <td>
                  <img src={user.avatar} alt={user.first_name} width="70" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination defaultCurrent={1} total={500} />
      </div>
    </div>
  );
};
