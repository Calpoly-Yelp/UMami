import React, { useMemo, useState } from "react";
import "./onboarding.css";
import { useNavigate } from "react-router-dom";
// import { supabase } from "../supabaseClient";

const STEPS = [
   { key: "role", label: "Who are you?" },
   { key: "budget", label: "Budget" },
   { key: "diet", label: "Dietary Needs" },
   { key: "priorities", label: "What matters most?" },
   { key: "notifications", label: "Notifications" },
];

export default function Onboarding() {
   const navigate = useNavigate();
   const [stepIdx, setStepIdx] = useState(0);

   const [form, setForm] = useState({
      role: "",
      budget: "",
      diet: [],
      priorities: [],
      notifications: [],
   });

   const currentStep = STEPS[stepIdx];

   const progressPct = useMemo(() => {
      return Math.round(
         ((stepIdx + 1) / STEPS.length) * 100,
      );
   }, [stepIdx]);

   const canGoNext = useMemo(() => {
      switch (currentStep.key) {
         case "role":
            return !!form.role;
         case "budget":
            return !!form.budget;
         case "diet":
            return form.diet.length > 0;
         case "priorities":
            return (
               form.priorities.length > 0 &&
               form.priorities.length <= 2
            );
         case "notifications":
            return form.notifications.length > 0;
         default:
            return false;
      }
   }, [currentStep.key, form]);

   function next() {
      if (!canGoNext) return;
      if (stepIdx < STEPS.length - 1)
         setStepIdx((s) => s + 1);
      else finish();
   }

   function prev() {
      if (stepIdx > 0) setStepIdx((s) => s - 1);
   }

   function setSingle(name, value) {
      setForm((p) => ({ ...p, [name]: value }));
   }

   function toggleMulti(name, value, options = {}) {
      const { exclusiveValue, max } = options;

      setForm((p) => {
         const current = p[name];
         let nextArr = Array.isArray(current)
            ? [...current]
            : [];
         if (exclusiveValue && value === exclusiveValue) {
            return { ...p, [name]: [exclusiveValue] };
         }
         if (
            exclusiveValue &&
            nextArr.includes(exclusiveValue)
         ) {
            nextArr = nextArr.filter(
               (v) => v !== exclusiveValue,
            );
         }

         if (nextArr.includes(value)) {
            nextArr = nextArr.filter((v) => v !== value);
         } else {
            if (max && nextArr.length >= max) return p;
            nextArr.push(value);
         }
         return { ...p, [name]: nextArr };
      });
   }

   async function finish() {
      // const { data: { user } } = await supabase.auth.getUser();
      // if (user) {
      //   await supabase.from("profiles").upsert({
      //     id: user.id,
      //     role: form.role,
      //     budget: form.budget,
      //     diet: form.diet,
      //     priorities: form.priorities,
      //     notifications: form.notifications,
      //     onboarded: true,
      //   });
      // }
      navigate("/home");
   }

   return (
      <div className="ob">
         <aside className="ob__side">
            <div className="ob__sideInner">
               <div className="ob__sideTitle">umami</div>

               <nav className="ob__nav">
                  {STEPS.map((s, idx) => (
                     <button
                        key={s.key}
                        type="button"
                        className={
                           "ob__navItem " +
                           (idx === stepIdx
                              ? "is-active"
                              : "") +
                           (idx < stepIdx ? "is-done" : "")
                        }
                        onClick={() =>
                           idx <= stepIdx && setStepIdx(idx)
                        }
                        aria-current={
                           idx === stepIdx
                              ? "step"
                              : undefined
                        }
                     >
                        {s.label}
                     </button>
                  ))}
               </nav>
            </div>
         </aside>

         <main className="ob__main">
            <div
               className="ob__card"
               role="dialog"
               aria-label="Onboarding"
            >
               {currentStep.key === "role" && (
                  <Step
                     title="What best describes you?"
                     subtitle="Select one:"
                     progress={progressPct}
                     footerLeft={<div />}
                     footerRight={
                        <div className="ob__footerBtns">
                           <button
                              className="ob__btn ob__btnGhost"
                              onClick={() =>
                                 navigate("/home")
                              }
                           >
                              Skip Survey
                           </button>
                           <button
                              className="ob__btn ob__btnPrimary"
                              disabled={!canGoNext}
                              onClick={next}
                           >
                              Next →
                           </button>
                        </div>
                     }
                  >
                     <CheckboxRow
                        checked={form.role === "student"}
                        label="Cal Poly student"
                        onChange={() =>
                           setSingle("role", "student")
                        }
                        single
                     />
                     <CheckboxRow
                        checked={form.role === "staff"}
                        label="Faculty/Staff"
                        onChange={() =>
                           setSingle("role", "staff")
                        }
                        single
                     />
                     <CheckboxRow
                        checked={form.role === "visitor"}
                        label="Visitor/local"
                        onChange={() =>
                           setSingle("role", "visitor")
                        }
                        single
                     />
                  </Step>
               )}

               {currentStep.key === "budget" && (
                  <Step
                     title="What is your typical budget per meal?"
                     subtitle=""
                     progress={progressPct}
                     footerLeft={
                        <button
                           className="ob__btn ob__btnOutline"
                           onClick={prev}
                        >
                           ← Previous
                        </button>
                     }
                     footerRight={
                        <button
                           className="ob__btn ob__btnPrimary"
                           disabled={!canGoNext}
                           onClick={next}
                        >
                           Next →
                        </button>
                     }
                  >
                     <CheckboxRow
                        checked={form.budget === "under10"}
                        label="Under $10"
                        onChange={() =>
                           setSingle("budget", "under10")
                        }
                        single
                     />
                     <CheckboxRow
                        checked={form.budget === "10to20"}
                        label="$10–$20"
                        onChange={() =>
                           setSingle("budget", "10to20")
                        }
                        single
                     />
                     <CheckboxRow
                        checked={form.budget === "20to25"}
                        label="$20–$25"
                        onChange={() =>
                           setSingle("budget", "20to25")
                        }
                        single
                     />
                     <CheckboxRow
                        checked={form.budget === "25plus"}
                        label="$25+"
                        onChange={() =>
                           setSingle("budget", "25plus")
                        }
                        single
                     />
                  </Step>
               )}

               {currentStep.key === "diet" && (
                  <Step
                     title="Do you have any dietary preferences or restrictions?"
                     subtitle="Select all that apply:"
                     progress={progressPct}
                     footerLeft={
                        <button
                           className="ob__btn ob__btnOutline"
                           onClick={prev}
                        >
                           ← Previous
                        </button>
                     }
                     footerRight={
                        <button
                           className="ob__btn ob__btnPrimary"
                           disabled={!canGoNext}
                           onClick={next}
                        >
                           Next →
                        </button>
                     }
                  >
                     <CheckboxRow
                        checked={form.diet.includes(
                           "vegetarian",
                        )}
                        label="Vegetarian"
                        onChange={() =>
                           toggleMulti(
                              "diet",
                              "vegetarian",
                              { exclusiveValue: "none" },
                           )
                        }
                     />
                     <CheckboxRow
                        checked={form.diet.includes(
                           "vegan",
                        )}
                        label="Vegan"
                        onChange={() =>
                           toggleMulti("diet", "vegan", {
                              exclusiveValue: "none",
                           })
                        }
                     />
                     <CheckboxRow
                        checked={form.diet.includes(
                           "glutenfree",
                        )}
                        label="Gluten-free"
                        onChange={() =>
                           toggleMulti(
                              "diet",
                              "glutenfree",
                              { exclusiveValue: "none" },
                           )
                        }
                     />
                     <CheckboxRow
                        checked={form.diet.includes(
                           "dairyfree",
                        )}
                        label="Dairy-free"
                        onChange={() =>
                           toggleMulti(
                              "diet",
                              "dairyfree",
                              { exclusiveValue: "none" },
                           )
                        }
                     />
                     <CheckboxRow
                        checked={form.diet.includes("none")}
                        label="No restrictions"
                        onChange={() =>
                           toggleMulti("diet", "none", {
                              exclusiveValue: "none",
                           })
                        }
                     />
                  </Step>
               )}

               {currentStep.key === "priorities" && (
                  <Step
                     title="What matters most to you when choosing restaurants?"
                     subtitle="Choose up to 2"
                     progress={progressPct}
                     footerLeft={
                        <button
                           className="ob__btn ob__btnOutline"
                           onClick={prev}
                        >
                           ← Previous
                        </button>
                     }
                     footerRight={
                        <button
                           className="ob__btn ob__btnPrimary"
                           disabled={!canGoNext}
                           onClick={next}
                        >
                           Next →
                        </button>
                     }
                  >
                     <CheckboxRow
                        checked={form.priorities.includes(
                           "quality",
                        )}
                        label="Food quality"
                        onChange={() =>
                           toggleMulti(
                              "priorities",
                              "quality",
                              { max: 2 },
                           )
                        }
                     />
                     <CheckboxRow
                        checked={form.priorities.includes(
                           "price",
                        )}
                        label="Price"
                        onChange={() =>
                           toggleMulti(
                              "priorities",
                              "price",
                              { max: 2 },
                           )
                        }
                     />
                     <CheckboxRow
                        checked={form.priorities.includes(
                           "wait",
                        )}
                        label="Short wait time"
                        onChange={() =>
                           toggleMulti(
                              "priorities",
                              "wait",
                              { max: 2 },
                           )
                        }
                     />
                     <CheckboxRow
                        checked={form.priorities.includes(
                           "healthy",
                        )}
                        label="Healthy"
                        onChange={() =>
                           toggleMulti(
                              "priorities",
                              "healthy",
                              { max: 2 },
                           )
                        }
                     />
                     <CheckboxRow
                        checked={form.priorities.includes(
                           "study",
                        )}
                        label="Study-friendly"
                        onChange={() =>
                           toggleMulti(
                              "priorities",
                              "study",
                              { max: 2 },
                           )
                        }
                     />
                     {form.priorities.length >= 2 && (
                        <div className="ob__hint">
                           You’ve selected 2. Uncheck one to
                           change.
                        </div>
                     )}
                  </Step>
               )}

               {currentStep.key === "notifications" && (
                  <Step
                     title="What updates would you like to receive?"
                     subtitle="Select all that apply:"
                     progress={progressPct}
                     footerLeft={
                        <button
                           className="ob__btn ob__btnOutline"
                           onClick={prev}
                        >
                           ← Previous
                        </button>
                     }
                     footerRight={
                        <button
                           className="ob__btn ob__btnPrimary"
                           disabled={!canGoNext}
                           onClick={next}
                        >
                           Finish →
                        </button>
                     }
                  >
                     <CheckboxRow
                        checked={form.notifications.includes(
                           "menu",
                        )}
                        label="Restaurant menu updates"
                        onChange={() =>
                           toggleMulti(
                              "notifications",
                              "menu",
                              { exclusiveValue: "none" },
                           )
                        }
                     />
                     <CheckboxRow
                        checked={form.notifications.includes(
                           "besttimes",
                        )}
                        label="Best times to order (avoid long waits)"
                        onChange={() =>
                           toggleMulti(
                              "notifications",
                              "besttimes",
                              { exclusiveValue: "none" },
                           )
                        }
                     />
                     <CheckboxRow
                        checked={form.notifications.includes(
                           "friends",
                        )}
                        label="Friend activity (reviews, new friend requests)"
                        onChange={() =>
                           toggleMulti(
                              "notifications",
                              "friends",
                              { exclusiveValue: "none" },
                           )
                        }
                     />
                     <CheckboxRow
                        checked={form.notifications.includes(
                           "none",
                        )}
                        label="No notifications"
                        onChange={() =>
                           toggleMulti(
                              "notifications",
                              "none",
                              { exclusiveValue: "none" },
                           )
                        }
                     />
                  </Step>
               )}
            </div>
         </main>
      </div>
   );
}

function Step({
   title,
   subtitle,
   progress,
   children,
   footerLeft,
   footerRight,
}) {
   return (
      <>
         <h1 className="ob__title">{title}</h1>
         {subtitle ? (
            <div className="ob__subtitle">{subtitle}</div>
         ) : (
            <div className="ob__subtitle" />
         )}
         <div className="ob__content">{children}</div>

         <div className="ob__progressWrap">
            <div className="ob__progressLabel">
               <span>Progress</span>
               <span className="ob__progressPct">
                  {progress}%
               </span>
            </div>
            <div
               className="ob__progressBar"
               aria-label="Progress"
            >
               <div
                  className="ob__progressFill"
                  style={{ width: `${progress}%` }}
               />
            </div>
         </div>

         <div className="ob__footer">
            <div>{footerLeft}</div>
            <div>{footerRight}</div>
         </div>
      </>
   );
}

function CheckboxRow({ checked, label, onChange, single }) {
   return (
      <label className="ob__row">
         <input
            type="checkbox"
            className="ob__checkbox"
            checked={checked}
            onChange={onChange}
            aria-checked={checked}
         />
         <span
            className={
               "ob__rowLabel " + (single ? "is-single" : "")
            }
         >
            {label}
         </span>
      </label>
   );
}
