import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const formResponse = await res.json();
      if (res.ok) {
        localStorage.setItem("token", formResponse.token);
        localStorage.setItem("user", JSON.stringify(formResponse.user)); //converting json data into string because local storage does't support json format to store
        navigate("/") //after successfull signup redirect user to home page
      } else {
        alert(formResponse.message || "Signup Failed");
      }
    } catch (error) {
      alert("Failed to Signup. Check console");
      console.error("❌Signup Failed! Error=>", error.message);
    } finally {
      setLoading(false);
    }
  };

  return <div>Signup</div>;
};

export default Signup;
