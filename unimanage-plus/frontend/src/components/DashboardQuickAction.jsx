import { Link } from "react-router-dom";

const DashboardQuickAction = ({ icon, title, description, path }) => {
  return (
    <Link to={path} className="quick-action-card">
      <div className="quick-action-icon">{icon}</div>

      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </Link>
  );
};

export default DashboardQuickAction;