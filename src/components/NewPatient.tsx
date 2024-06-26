import React, { useRef, useState } from "react";
import { Formik, useFormikContext } from "formik";
import { useReactToPrint, ReactToPrintProps } from "react-to-print";
import { SimpleInput } from "../components/SimpleInput";
import { validationSchema } from "./Schema";
import { Back } from "./BackButton";
import { IPatient, ITransactionStatus, PaymentMethod } from "../types/electron-api";
import BillFormat from './BillFormat';
import { toast, ToastContainer } from "react-toastify"; // Import toast and ToastContainer
import "react-toastify/dist/ReactToastify.css"; // Import toastify CSS

interface FormValues {
  fullname: string;
  mobile: string;
  treatment: string;
  total_amount: string;
  paid_amount: string;
  payment_type: string;
  previous_paid?: string;
}

export const NewPatient = () => {
  const printRef = useRef(null);
  const [patientData, setPatientData] = useState(null);
  const [patients, setPatients] = useState<IPatient[]>([]);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  } as ReactToPrintProps);

  const clearForm = () => {
    setPatientData(null);
  };

  const ClearButton = () => {
    const { resetForm } = useFormikContext(); // Get resetForm function from Formik context

    const handleClick = () => {
      resetForm(); // Reset form values
      clearForm(); // Clear patient data
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        className="w-full p-4 bg-blue-100 rounded-lg shadow-md cursor-pointer hover:bg-green-100 transition duration-300 ease-in-out transform hover:text-blue-800 font-bold"
      >
        Clear
      </button>
    );
  };

  return (
    <div className="container mx-auto mt-4">
      <Back />
      <div className="flex flex-wrap justify-center text-center">
      <div className="w-1/2 p-4 bg-white-100 rounded-lg hover:bg-green-100 transition duration-300 ease-in-out transform hover:text-blue-400 mb-8">
          <h2 className="text-lg font-bold">New Patient</h2>
        </div>
      </div>
      
      <Formik
        initialValues={{
          fullname: "",
          mobile: "",
          treatment: "",
          total_amount: "",
          paid_amount: "",
          payment_type: "cash",
          previous_paid: "",
        }}
        validationSchema={validationSchema}
        onSubmit={async (values, { resetForm }) => {
          // Check if the patient already exists
          const duplicatePatient = patients.find(
            (patient) =>
              patient.fullname === values.fullname &&
              patient.mobile === values.mobile
          );

          if (duplicatePatient) {
            toast.error("Patient already submitted!", {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            });
            return; // Exit the function if a duplicate is found
          }

          const pendingAmount =
            parseFloat(values.total_amount || "0") -
            parseFloat(values.paid_amount || "0");
          const patient = {
            fullname: values.fullname,
            mobile: values.mobile,
            treatment: values.treatment,
            invoice: {
              description: values.fullname,
              total: parseFloat(values.total_amount || "0"),
              transactions: [
                {
                  status: ITransactionStatus.Pending,
                  amount: pendingAmount,
                  description: "Pending Payment",
                  paymentMethod: PaymentMethod.None,
                },
                {
                  status: ITransactionStatus.Paid,
                  amount: parseFloat(values.paid_amount || "0"),
                  description: `Paid Amount (${values.payment_type})`,
                  paymentMethod: values.payment_type,
                },
              ],
            },
          } as IPatient;
          patient.invoice.transactions = patient.invoice.transactions.filter(t => !(t.amount == 0 && t.status == ITransactionStatus.Paid))
          const insert = await window.electronAPI.insertPatient(patient);

          console.log("Insert: ");
          console.table(insert);
          console.log("Fetch: ");
          const allPatients = await window.electronAPI.fetchAll();
          console.table(allPatients);
          setPatients(allPatients); // Update the patients state with all patients

          // Set the patient data after submission
          setPatientData({
            patient: {
              fullname: values.fullname,
              mobile: values.mobile,
              patientRegistrationId: "", // Example ID
              referenceNumber: "", // Example bill number
            },
            values,
          });

          // Show toast notification after form submission
          toast.success("Bill submitted successfully!", {
            position: "top-center", // Use a string for the position
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        }}
      >
        {({ handleSubmit, isSubmitting, values, handleChange, handleBlur }) => (
          <form onSubmit={handleSubmit} className="space-y-6">
            <SimpleInput
              handleBlur={handleBlur}
              handleChange={handleChange}
              values={values}
              label="Full Name"
              field="fullname"
            />
            <SimpleInput
              handleBlur={handleBlur}
              handleChange={handleChange}
              values={values}
              label="Mobile"
              field="mobile"
            />
            <SimpleInput
              handleBlur={handleBlur}
              handleChange={handleChange}
              values={values}
              label="Treatment"
              field="treatment"
            />
            <div className="flex items-center justify-between">
              <SimpleInput
                handleBlur={handleBlur}
                handleChange={handleChange}
                values={values}
                label="Total Amount"
                field="total_amount"
              />
              <SimpleInput
                handleBlur={handleBlur}
                handleChange={handleChange}
                values={values}
                label="Amount Paid"
                field="paid_amount"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="payment_type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Payment Type
              </label>
              <select
                id="payment_type"
                name="payment_type"
                value={values.payment_type}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-36 py-2 pl-3 pr-8 border border-gray-900 focus:outline-none focus:ring-blue-100 focus:border-blue-100 text-sm rounded-md"
              >
                <option value="cash">cash</option>
                <option value="card">card</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div></div>
              <div className="flex items-center">
                <label
                  htmlFor="amount_due"
                  className="block text-sm font-medium text-gray-700 mr-4"
                >
                  Amount Due
                </label>
                <span
                  id="amount_due"
                  className="text-lg font-semibold text-gray-900"
                >
                  Rs.
                  {(
                    parseFloat(values.total_amount || "0") -
                    parseFloat(values.paid_amount || "0")
                  ).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full p-4 bg-blue-100 rounded-lg shadow-md cursor-pointer hover:bg-green-100 transition duration-300 ease-in-out transform hover:text-blue-800 font-bold"
              >
                Submit
              </button>
              {patientData && (
                <button
                  id="print-bill-button"
                  onClick={() => {
                    handlePrint();
                  }}
                  className="w-full p-4 bg-blue-100 rounded-lg shadow-md cursor-pointer hover:bg-green-100 transition duration-300 ease-in-out transform hover:text-blue-800 font-bold"
                >
                  Print Bill
                </button>
              )}
              <ClearButton />
            </div>
          </form>
        )}
      </Formik>
      {patientData && (
        <div className="hidden">
          <BillFormat ref={printRef} patient={patientData.patient} values={patientData.values} />
        </div>
      )}
      <ToastContainer /> {/* Add ToastContainer to render toast notifications */}
      </div>
  );
};

export default NewPatient;
