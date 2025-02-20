import UsersPage from "./page/UsersPage";
import VisitCounter from "./Components/VisitCounter";

export default function App() {
  return (
    <div style={{ padding: "9px" }}>
      <center>
        <h1>
          Calculadora de Importacion de Vehiculos de la Republica Dominicana.{" "}
        </h1>
      </center>
      <br></br>
      <VisitCounter />
      <UsersPage></UsersPage>

      <center style={{ marginTop: "10px" }}>
        <b>
          By <h4>K3D Technology</h4>
        </b>
      </center>
    </div>
  );
}
