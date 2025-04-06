import Team from "../assets/about.jpg";
import Roy from "../assets/2x2.jpg";
import Report from "../assets/report1.png"
import Pic2 from "../assets/pic2.png"


function About() {
  return (
    <div>
      {/* <img src={Team} className="img-fluid height-50"></img> */}

      <div class="container marketing">
        {/* <div class="row text-bg-dark rounded-3 text-center">
          <div class="col-lg-4 ">
            <img src={Roy} 
            className=" rounded-circle w-50" />
              <title>Placeholder</title>
              <rect
                width="100%"
                height="100%"
                fill="var(--bs-secondary-color)"
              />
            
            <h2 class="fw-normal">Heading</h2>
            <p>
              Some representative placeholder content for the three columns of
              text below the carousel. This is the first column.
            </p>
            <p>
              <a class="btn btn-secondary" href="#">
                View details &raquo;
              </a>
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
            
            <h2 class="fw-normal">Heading</h2>
            <p>
              Another exciting bit of representative placeholder content. This
              time, we've moved on to the second column.
            </p>
            <p>
              <a class="btn btn-secondary" href="#">
                View details &raquo;
              </a>
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
            
            <h2 class="fw-normal">Heading</h2>
            <p>
              And lastly this, the third column of representative placeholder
              content.
            </p>
            <p>
              <a class="btn btn-secondary" href="#">
                View details &raquo;
              </a>
            </p>
          </div>
        </div> */}

        <hr class="featurette-divider" />

        <div class="row featurette">
          <div class="col-md-7">
            <h2 class="featurette-heading fw-normal lh-1">
              Wear the prototype.{" "}
              <span class="text-body-secondary">Uncover What Your Sleep’s Been Hiding.</span>
            </h2>
            <p class="lead">
            Comfortable, low-profile gear built to capture real sleep apnea signals.
            Just strap on the oximeter, nasal cannula, and chest belt—everything you need for clinical-grade monitoring at home.
            </p>
          </div>
          <div class="col-md-5">
            <svg
              class="bd-placeholder-img bd-placeholder-img-lg featurette-image img-fluid mx-auto"
              width="500"
              height="500"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Placeholder: 500x500"
              preserveAspectRatio="xMidYMid slice"
            >
              <title>Placeholder</title>
              <rect width="100%" height="100%" fill="var(--bs-secondary-bg)" />
              <text x="50%" y="50%" fill="var(--bs-secondary-color)" dy=".3em">
                500x500
              </text>
            </svg>
          </div>
        </div>

        <hr class="featurette-divider" />

        <div class="row featurette">
          <div class="col-md-7 order-md-2">
            <h2 class="featurette-heading fw-normal lh-1">
              Start the session.{" "}
              <span class="text-body-secondary">Let the Data Tell the Story.</span>
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
      </div>
    </div>
  );
}

export default About;
