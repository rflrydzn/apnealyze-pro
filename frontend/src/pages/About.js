import Team from "../assets/about.jpg";
import Roy from "../assets/2x2.jpg";
import Report from "../assets/report1.png"
import Pic2 from "../assets/milis.png"
import Prototype from "../assets/prototype.png"
import Prototype2 from "../assets/prototype2.png"
import ml from "../assets/ml2.png"
import arduino from "../assets/arduino.png"
import seng from "../assets/seng.jpg"
import enrico from "../assets/enrico.jpg"


function About() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center">
      <img src={Prototype2} className=" " height="500"></img>
        <div className="text-center">
        <h2 className=" fw-bold" style={{fontSize:'7vw'}}>Apnea-lyze Pro</h2>
        <p>An affordable, automated solution for obstructive sleep apnea—where 
          cutting-edge hardware and intelligent AI work seamlessly to deliver precise, 
          at-home sleep analysis.</p>
          <button className="btn btn-outline-dark fs-4">Start OSA Test</button>
        </div>
      
      <img src={ml} className="" height="400"></img>
      </div>
      <div class="container marketing">
        

        <hr class="featurette-divider" />

        <div class="row featurette">
          <div class="col-md-7">
            <h2 class="featurette-heading fw-normal lh-1">
              Equip Yourself.{" "}
              <span class="text-body-secondary">Unlock Affordable Sleep Apnea Monitoring.</span>
            </h2>
            <p class="lead">
            Built with Arduino, a thermistor, flex sensor, and other cost-effective components, 
            our prototype delivers accurate, real-time data for sleep apnea detection—bringing 
            clinical insight to your bedroom without the clinical price tag.
            </p>
          </div>
          <div class="col-md-5">
          <img
              class="bd-placeholder-img bd-placeholder-img-lg featurette-image"
              width="500"
              height="500"
              src={arduino}
              
            
            />
          </div>
        </div>

        <hr class="featurette-divider" />

        <div class="row featurette">
          <div class="col-md-7 order-md-2">
            <h2 class="featurette-heading fw-normal lh-1">
              Capture Every Breathe.{" "}
              <span class="text-body-secondary">Every Drop.</span>
            </h2>
            <p class="lead">
            Continuous tracking that doesn’t miss a breath.
            Once you begin, the system records your vitals every 250 milliseconds—breath patterns, oxygen drops, and subtle disruptions all in high resolution.
            </p>
          </div>
          <div class="col-md-5 ">
          <img
              class="bd-placeholder-img bd-placeholder-img-lg featurette-image"
              width="500"
              height="500"
              src={Pic2}
              
            
            />
          </div>
        </div>

        <hr class="featurette-divider" />

        <div class="row featurette">
          <div class="col-md-7">
            <h2 class="featurette-heading fw-normal lh-1">
            Wake Up to Answers.{" "}
              <span class="text-body-secondary">Not Questions.</span>
            </h2>
            <p class="lead">
            Your night visualized with clarity and insight.
            Dive into a detailed sleep apnea report with timelines, graphs, and event flags that make sense of what’s really going on while you sleep.
            </p>
          </div>
          <div class="col-md-5">
            <img
              class="bd-placeholder-img bd-placeholder-img-lg featurette-image"
              width="500"
              height="500"
              src={Report}
              
            
            />
              
            
          </div>
        </div>

        <hr class="featurette-divider" />

        <div class="row featurette">
          <div class="col-md-7 order-md-2">
            <h2 class="featurette-heading fw-normal lh-1">
              Capture Every Breathe.{" "}
              <span class="text-body-secondary">Every Drop.</span>
            </h2>
            <p class="lead">
            Continuous tracking that doesn’t miss a breath.
            Once you begin, the system records your vitals every 250 milliseconds—breath patterns, oxygen drops, and subtle disruptions all in high resolution.
            </p>
          </div>
          <div class="col-md-5 ">
          <img
              class="bd-placeholder-img bd-placeholder-img-lg featurette-image"
              width="500"
              height="500"
              src={Pic2}
              
            
            />
          </div>
        </div>

        <hr class="featurette-divider" />


        <h2 className="my-4 fw-bolder">The Team</h2>
        <div class="row rounded-3 text-center">
          <div class="col-lg-4 ">
            <img src={enrico} 
            className=" rounded-circle w-50" />
              <title>Placeholder</title>
              <rect
                width="100%"
                height="100%"
                fill="var(--bs-secondary-color)"
              />
            
            <h2 class="fw-normal">Enrico Velasquez</h2>
            <p>
            Enrico brings the design to life with detailed documentation and a custom 3D prototype.
            </p>
            
          </div>
          <div class="col-lg-4">
            
                <img src={Roy} 
            className=" rounded-circle w-50" />
              <title>Placeholder</title>
              <rect
                width="100%"
                height="100%"
                fill="var(--bs-secondary-color)"
              />
            
            <h2 class="fw-normal">Rafael Dizon</h2>
            <p>
            Rafael leads the charge, engineering both the hardware and software that power the system.
            </p>
            
          </div>
          <div class="col-lg-4">
            
                <img src={seng} 
            className=" rounded-circle w-50" />
              <title>Placeholder</title>
              <rect
                width="100%"
                height="100%"
                fill="var(--bs-secondary-color)"
              />
            
            <h2 class="fw-normal">Russel Samson</h2>
            <p>
            Russel makes sure the hardware runs reliably, helping assemble and refine the device.
            </p>
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
