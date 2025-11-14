const STORAGE_KEY = 'carbonTrackerActivities';

export const getActivities = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const addActivity = (newActivity) => {
  const activities = getActivities();
  
  const updatedActivities = [...activities, newActivity];

  const lastSevenActivities = updatedActivities.slice(-7);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lastSevenActivities));
  return lastSevenActivities;
};
