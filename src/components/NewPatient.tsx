import React, { useRef, useState } from "react";
import { Formik } from "formik";
import { useReactToPrint, ReactToPrintProps } from "react-to-print";
import { SimpleInput } from "../components/SimpleInput";
import { validationSchema } from "./Schema";
import { Back } from "./BackButton";
import { IPatient, ITransactionStatus } from "../types/electron-api";
import BillFormat from './BillFormat';

interface FormValues {
  fullname: string;
  mobile: string;
  treatment: string;
  total_amount: string;
  paid_amount: string;
  payment_type: string; // Add payment_type field
  previous_paid?: string; // Make previous_paid optional
}

export const NewPatient = () => {
  const printRef = useRef(null);
  const [patientData, setPatientData] = useState(null);
  const [patients, setPatients] = useState<IPatient[]>([]); // State to store all patients

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  } as ReactToPrintProps);

  return (
    <div className="container mx-auto">
      <div className="flex items-center ">
        <Back />
        <h1 className="text-3xl font-bold mt-8 mb-8 px-5 py-2">New Patient</h1>
      </div>
      <Formik
        initialValues={{
          fullname: "",
          mobile: "",
          treatment: "",
          total_amount: "",
          paid_amount: "",
          payment_type: "Cash", // Default to Cash
          previous_paid: "", // Add previous_paid here
        }}
        validationSchema={validationSchema}
        onSubmit={async (values, { resetForm }) => {
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
                },
                {
                  status: ITransactionStatus.Paid,
                  amount: parseFloat(values.paid_amount || "0"),
                  description: `Paid Amount (${values.payment_type})`,
                },
              ],
            },
          } as IPatient;
          const insert = await window.electronAPI.insertPatient(patient);

          console.log("Insert: ");
          console.table(insert);
          console.log("Fetch: ");
          const allPatients = await window.electronAPI.fetchAll();
          console.table(allPatients);
          setPatients(allPatients); // Update the patients state with all patients
          resetForm();

          // Set the patient data after submission
          setPatientData({
            patient: {
              fullname: values.fullname,
              mobile: values.mobile,
              patientRegistrationId: '12345', // Example ID
              referenceNumber: 'BILL123', // Example bill number
            },
            values,
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
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
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
                  ).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-100 text-black font-bold rounded-md hover:bg-blue-300 focus:outline-none focus:bg-blue-400"
                >
                Submit
              </button>
              {/* Render the print button when patientData is available */}
      {patientData && (
          <button
            id="print-bill-button" // Add id for the print button
            onClick={handlePrint}
            className="ml-4 px-4 py-2 bg-green-100 text-black font-bold rounded-md hover:bg-green-300 focus:outline-none focus:bg-green-400"
            >
            Print Bill
          </button>
      )}
              </div>
          </form>
        )}
      </Formik>

      {/* Render the BillFormat component after form submission */}
      {patientData && (
        <div className="hidden">
          <BillFormat
            ref={printRef}
            patient={patientData.patient}
            values={patientData.values}
          />
        </div>
      )}

      
    </div>
  );
};

export default NewPatient;
