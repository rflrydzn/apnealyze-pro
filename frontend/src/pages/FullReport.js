import SleepReport from "./SleepReport";
import SleepGraph from "./SleepGraph"
import "bootstrap/dist/css/bootstrap.min.css";

function FullReport () {
    return (
        <div>
            <SleepReport />
            <SleepGraph />

        </div>
    )
}

export default FullReport;