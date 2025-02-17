import UsersPage from "./page/UsersPage";
import VisitCounter from "./Components/VisitCounter";
import { CalculatorFilled, CalculatorTwoTone } from "@ant-design/icons";

export default function App() {
  return (
    <div style={{ padding: "9px" }}>
      <center>
        <h1>
          <CalculatorTwoTone
            style={{ color: "#1890ff", fontSize: "40px", marginRight: "8px" }}
          />
          Calculadora de Importacion de Vehiculos de la Republica Dominicana.{" "}
          {""}
          <CalculatorFilled
            style={{ color: "#1890ff", fontSize: "40px", marginRight: "8px" }}
          />
        </h1>
      </center>
      <br></br>
      <VisitCounter />
      <UsersPage></UsersPage>

      <center style={{ marginTop: "10px" }}>
        <b>
          By <img src="/k.png" alt="K3D Logo" style={{ height: "20px" }} />
          <img src="/number-3.png" alt="K3D Logo" style={{ height: "20px" }} />
          <img src="/d.png" alt="K3D Logo" style={{ height: "20px" }} />
          Technology.
        </b>
      </center>
    </div>
  );
}
