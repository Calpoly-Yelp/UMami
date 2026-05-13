import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Onboarding.css";
import logo from "../assets/logo.png";

const steps = [
   {
      id: 1,
      key: "role",
      navLabel: "Who are you?",
      title: "What best describes you?",
      subtitle: "",
      type: "single",
      options: [
         "Cal Poly student",
         "Faculty/Staff",
         "Visitor/Local",
      ],
   },
   {
      id: 2,
      key: "budget",
      navLabel: "Budget",
      title: "What is your typical budget per meal?",
      subtitle: "",
      type: "single",
      options: ["Under $10", "$10-$20", "$20-$25", "$25+"],
   },
   {
      id: 3,
      key: "dietary",
      navLabel: "Dietary Needs",
      title: "Do you have any dietary preferences or restrictions?",
      subtitle: "Select all that apply:",
      type: "multi",
      options: [
         "Vegetarian",
         "Vegan",
         "Gluten-free",
         "Dairy-free",
         "No restrictions",
      ],
   },
   {
      id: 4,
      key: "priorities",
      navLabel: "What matters most?",
      title: "What matters most to you when choosing restaurants?",
      subtitle: "Choose up to 2",
      type: "multi-limit",
      limit: 2,
      options: [
         "Food quality",
         "Price",
         "Short wait time",
         "Healthy",
         "Study-friendly",
      ],
   },
   {
      id: 5,
      key: "notifications",
      navLabel: "Notifications",
      title: "What updates would you like to receive?",
      subtitle: "Select all that apply:",
      type: "multi",
      options: [
         "Restaurant menu updates",
         "Best times to order (avoid long waits)",
         "Friend activity (reviews, new friend requests)",
         "No notifications",
      ],
   },
];

export default function Onboarding() {
   const navigate = useNavigate();
   const [currentStep, setCurrentStep] = useState(0);
   const [error, setError] = useState("");

   const [answers, setAnswers] = useState({
      role: [],
      budget: [],
      dietary: [],
      priorities: [],
      notifications: [],
   });

   const step = steps[currentStep];
   const selectedValues = useMemo(
      () => answers[step.key] || [],
      [answers, step.key],
   );
   const progressPercent = useMemo(
      () =>
         Math.round(
            ((currentStep + 1) / steps.length) * 100,
         ),
      [currentStep],
   );

   const isStepValid = useMemo(() => {
      if (step.type === "single")
         return selectedValues.length === 1;
      if (step.type === "multi-limit") {
         return (
            selectedValues.length >= 1 &&
            selectedValues.length <= step.limit
         );
      }
      return selectedValues.length >= 1;
   }, [selectedValues, step]);

   const handleOptionToggle = (option) => {
      setError("");

      setAnswers((prev) => {
         const currentValues = prev[step.key] || [];

         if (step.type === "single") {
            return { ...prev, [step.key]: [option] };
         }

         const alreadySelected =
            currentValues.includes(option);

         if (step.type === "multi-limit") {
            if (alreadySelected) {
               return {
                  ...prev,
                  [step.key]: currentValues.filter(
                     (item) => item !== option,
                  ),
               };
            }

            if (
               step.limit &&
               currentValues.length >= step.limit
            ) {
               return prev;
            }

            return {
               ...prev,
               [step.key]: [...currentValues, option],
            };
         }

         return {
            ...prev,
            [step.key]: alreadySelected
               ? currentValues.filter(
                    (item) => item !== option,
                 )
               : [...currentValues, option],
         };
      });
   };

   const handleNext = () => {
      if (!isStepValid) {
         setError("Please make a selection to continue.");
         return;
      }

      setError("");

      if (currentStep < steps.length - 1) {
         setCurrentStep((prev) => prev + 1);
      } else {
         navigate("/restaurants");
      }
   };

   const handlePrevious = () => {
      setError("");
      if (currentStep > 0) {
         setCurrentStep((prev) => prev - 1);
      }
   };

   const handleSkip = () => {
      navigate("/restaurants");
   };

   return (
      <div className="onboarding">
         <aside className="onboarding__sidebar">
            <img
               src={logo}
               alt="Umami logo"
               className="onboarding__logo"
            />

            <div className="onboarding__nav">
               {steps.map((item, index) => {
                  const isActive = index === currentStep;

                  return (
                     <div
                        key={item.key}
                        className={`onboarding__navItem ${
                           isActive
                              ? "onboarding__navItem--active"
                              : ""
                        }`}
                     >
                        <span className="onboarding__navLabel">
                           {item.navLabel}
                        </span>
                        <span className="onboarding__navCircle">
                           {item.id}
                        </span>
                     </div>
                  );
               })}
            </div>
         </aside>

         <main className="onboarding__main">
            <section className="onboarding__card">
               <h1 className="onboarding__title">
                  {step.title}
               </h1>

               {step.subtitle ? (
                  <p className="onboarding__subtitle">
                     {step.subtitle}
                  </p>
               ) : null}

               <div className="onboarding__options">
                  {step.options.map((option) => {
                     const checked =
                        selectedValues.includes(option);

                     return (
                        <button
                           key={option}
                           type="button"
                           className={`onboarding__option ${
                              checked
                                 ? "onboarding__option--selected"
                                 : ""
                           }`}
                           onClick={() =>
                              handleOptionToggle(option)
                           }
                        >
                           <span className="onboarding__checkbox">
                              {checked ? (
                                 <svg
                                    viewBox="0 0 24 24"
                                    width="16"
                                    height="16"
                                    aria-hidden="true"
                                 >
                                    <path
                                       fill="currentColor"
                                       d="M9.2 16.6 4.9 12.3l-1.4 1.4 5.7 5.7L20.5 8.1l-1.4-1.4z"
                                    />
                                 </svg>
                              ) : null}
                           </span>

                           <span className="onboarding__optionText">
                              {option}
                           </span>
                        </button>
                     );
                  })}
               </div>

               {error ? (
                  <p className="onboarding__error">
                     {error}
                  </p>
               ) : null}

               <div className="onboarding__footer">
                  <div className="onboarding__progressWrap">
                     <div className="onboarding__progressText">
                        <span>Progress</span>
                        <span className="onboarding__progressPercent">
                           {progressPercent}%
                        </span>
                     </div>

                     <div className="onboarding__progressBar">
                        <div
                           className="onboarding__progressFill"
                           style={{
                              width: `${progressPercent}%`,
                           }}
                        />
                     </div>
                  </div>

                  <div className="onboarding__actions">
                     {currentStep === 0 ? (
                        <button
                           type="button"
                           className="btn btn-outline onboarding__btn"
                           onClick={handleSkip}
                        >
                           Skip Survey
                        </button>
                     ) : (
                        <button
                           type="button"
                           className="btn btn-outline onboarding__btn"
                           onClick={handlePrevious}
                        >
                           ← Previous
                        </button>
                     )}

                     <button
                        type="button"
                        className="btn btn-secondary onboarding__btn"
                        onClick={handleNext}
                     >
                        {currentStep === steps.length - 1
                           ? "Done"
                           : "Next →"}
                     </button>
                  </div>
               </div>
            </section>
         </main>
      </div>
   );
}
