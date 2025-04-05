// src/components/PredictForm.js
import React, { useState } from 'react';
import Logo from '../assets/logo.svg'

const PredictForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    BQ: 0,
    ESS: 5,
    BMI: 19,
    Weight: 50,
    Height: 160,
    Head: 45,
    Neck: 40,
    Waist: 90,
    Buttock: 85,
    Age: 25,
    Gender: 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    
    // <form onSubmit={handleSubmit}>
    //   <label>BQ</label>
    //   <input type="number" name="BQ" value={formData.BQ} onChange={handleChange} />

    //   <label>ESS</label>
    //   <input type="number" name="ESS" value={formData.ESS} onChange={handleChange} />

    //   <label>BMI</label>
    //   <input type="number" name="BMI" value={formData.BMI} onChange={handleChange} />

    //   <label>Weight</label>
    //   <input type="number" name="Weight" value={formData.Weight} onChange={handleChange} />

    //   <label>Height</label>
    //   <input type="number" name="Height" value={formData.Height} onChange={handleChange} />

    //   <label>Head</label>
    //   <input type="number" name="Head" value={formData.Head} onChange={handleChange} />

    //   <label>Neck</label>
    //   <input type="number" name="Neck" value={formData.Neck} onChange={handleChange} />

    //   <label>Waist</label>
    //   <input type="number" name="Waist" value={formData.Waist} onChange={handleChange} />

    //   <label>Buttock</label>
    //   <input type="number" name="Buttock" value={formData.Buttock} onChange={handleChange} />

    //   <label>Age</label>
    //   <input type="number" name="Age" value={formData.Age} onChange={handleChange} />

    //   <label>Gender</label>
    //   <input type="number" name="Gender" value={formData.Gender} onChange={handleChange} />

    //   <button type="submit">Submit</button>
    // </form>

    
    <>
      <form onSubmit={handleSubmit}>
      <section class="p-3 p-md-4 p-xl-5">
        <div class="container">
          <div class="card border-light-subtle shadow-sm">
            <div class="row g-0">
              <div class="col-12 col-md-6 text-bg-dark">
                <div class="d-flex align-items-center justify-content-center h-100">
                  <div class="col-10 col-xl-8 py-3">
                    <img class="img-fluid rounded mb-4" loading="lazy" src={Logo} width="245" height="80" alt="BootstrapBrain Logo" />
                    <hr class="border-primary-subtle mb-4"/>
                    <h2 class="h1 mb-4">We make digital products that drive you to stand out.</h2>
                    <p class="lead m-0">We write words, take photos, make videos, and interact with artificial intelligence.</p>
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <div class="card-body p-3 p-md-4 p-xl-5">
                  <div class="row">
                    <div class="col-12">
                      <div class="mb-5">
                        <h2 class="h3">Registration</h2>
                        <h3 class="fs-6 fw-normal text-secondary m-0">Enter your details to register</h3>
                      </div>
                    </div>
                  </div>
                  <form action="#!">
                    <div class="row gy-3 gy-md-4 overflow-hidden">
                      <div class="col-12">
                        <label for="firstName" class="form-label">BQ <span class="text-danger">*</span></label>
                        <input type="number" class="form-control" name="BQ" value={formData.BQ} placeholder="First Name" onChange={handleChange} required />
                      </div>
                      <div class="col-12">
                        <label for="firstName" class="form-label">ESS <span class="text-danger">*</span></label>
                        <input type="number" class="form-control" name="ESS" value={formData.BQ} placeholder="First Name" onChange={handleChange} required/>
                      </div>
                      <div class="col-12">
                        <label for="firstName" class="form-label">BMI <span class="text-danger">*</span></label>
                        <input type="number" class="form-control" name="BMI" value={formData.BMI} placeholder="First Name" onChange={handleChange} required/>
                      </div>
                      <div class="col-12">
                        <label for="firstName" class="form-label">Weight <span class="text-danger">*</span></label>
                        <input type="number" class="form-control" name="Weight" value={formData.Weight} placeholder="First Name" onChange={handleChange} required/>
                      </div>
                      <div class="col-12">
                        <label for="firstName" class="form-label">Height <span class="text-danger">*</span></label>
                        <input type="number" class="form-control" name="Height" value={formData.Height} placeholder="First Name" onChange={handleChange} required/>
                      </div>
                      <div class="col-12">
                        <label for="firstName" class="form-label">Head <span class="text-danger">*</span></label>
                        <input type="number" class="form-control" name="Head" value={formData.Head} placeholder="First Name" onChange={handleChange} required/>
                      </div>
                      <div class="col-12">
                        <label for="lastName" class="form-label">Neck <span class="text-danger">*</span></label>
                        <input type="number" class="form-control" name="Neck" value={formData.Neck} placeholder="Last Name" onChange={handleChange} required />
                      </div>
                      <div class="col-12">
                        <label for="email" class="form-label">Waist <span class="text-danger">*</span></label>
                        <input type="number" class="form-control" name="Waist" value={formData.Waist} placeholder="name@example.com" onChange={handleChange} required/>
                      </div>
                      <div class="col-12">
                        <label for="password" class="form-label">Buttock <span class="text-danger">*</span></label>
                        <input type="number" class="form-control" name="Buttock" value={formData.Buttock} onChange={handleChange} required/>
                      </div>
                      <div class="col-12">
                        <label for="password" class="form-label">Age <span class="text-danger">*</span></label>
                        <input type="number" class="form-control" name="Age"  value={formData.Age} onChange={handleChange} required/>
                      </div>
                      <div class="col-12">
                        <label for="password" class="form-label">Gender <span class="text-danger">*</span></label>
                        <input type="number" class="form-control" name="Gender" value={formData.Gender} onChange={handleChange} required/>
                      </div>
                      
                      <div class="col-12">
                        <div class="d-grid">
                          <button class="btn bsb-btn-xl btn-dark" type="submit">Classify</button>
                        </div>
                      </div>
                    </div>
                  </form>
                  
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </form>
    </>
    
  );
};

export default PredictForm;
