import React from "react";

export const Icons = {
  logo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 500 500"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        borderRadius: 0,
        transform: "rotate(180deg)",
      }}
      fill="currentColor"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M133.124 60.752a64 64 0 0 0-9.791-.752C88.355 60 60 88.355 60 123.333c0 3.33.257 6.6.752 9.791a85 85 0 0 0-.752 11.32c0 3.371.197 6.696.582 9.964A107 107 0 0 0 60 165.556c0 3.397.16 6.757.474 10.072a128.3 128.3 0 0 0-.073 21.186 150 150 0 0 0-.054 21.166 171 171 0 0 0-.041 21.153Q60 244.528 60 250c0 104.934 85.066 190 190 190s190-85.066 190-190S354.934 60 250 60q-5.472 0-10.867.306a172 172 0 0 0-21.153.04 150 150 0 0 0-21.166.055 128.4 128.4 0 0 0-21.186.073A107 107 0 0 0 165.556 60c-3.766 0-7.485.197-11.148.582a85 85 0 0 0-9.964-.582c-3.838 0-7.617.256-11.32.752m32.432 199.804c-39.972 0-74.178-24.687-88.203-59.645q.536-1.888 1.111-3.76c15.475 19.346 39.28 31.738 65.98 31.738 46.638 0 84.445-37.807 84.445-84.445 0-26.7-12.392-50.505-31.738-65.98q1.872-.575 3.76-1.111c34.958 14.025 59.645 48.231 59.645 88.203 0 52.467-42.533 95-95 95m-82.873-75.537c1.3-3.347 2.7-6.646 4.192-9.892 10.308 7.27 22.885 11.54 36.458 11.54 34.978 0 63.334-28.356 63.334-63.334 0-13.573-4.27-26.15-11.54-36.458a178 178 0 0 1 9.892-4.192c20.068 13.21 33.314 35.939 33.314 61.761 0 40.808-33.081 73.889-73.889 73.889-25.822 0-48.55-13.246-61.761-33.314m40.65-8.908a52.55 52.55 0 0 1-31.696-10.574 180.27 180.27 0 0 1 73.9-73.9 52.55 52.55 0 0 1 10.574 31.696c0 29.149-23.629 52.778-52.778 52.778m147.778-10.555c0-37.962-20.039-71.243-50.116-89.842 47.368 14.639 81.783 58.777 81.783 110.953 0 64.126-51.985 116.111-116.111 116.111-52.176 0-96.314-34.415-110.953-81.783 18.6 30.077 51.88 50.116 89.842 50.116 58.296 0 105.555-47.259 105.555-105.555m-20.224-88.092c37.371 22.025 62.446 62.685 62.446 109.203 0 69.956-56.71 126.666-126.666 126.666-46.518 0-87.178-25.075-109.203-62.446C95.539 305.554 147.052 345 207.778 345 283.564 345 345 283.564 345 207.778c0-60.726-39.446-112.24-94.113-130.314m104.669 130.314c0-55.076-30.13-103.115-74.806-128.534 61.975 21.475 106.472 80.364 106.472 149.645 0 87.445-70.888 158.333-158.333 158.333-69.281 0-128.17-44.497-149.645-106.472 25.419 44.676 73.458 74.806 128.534 74.806 81.615 0 147.778-66.163 147.778-147.778M310.594 81.044c51.988 28.792 87.184 84.208 87.184 147.845 0 93.275-75.614 168.889-168.889 168.889-63.637 0-119.053-35.196-147.845-87.184 24.853 69.289 91.116 118.85 168.956 118.85 99.104 0 179.444-80.34 179.444-179.444 0-77.84-49.561-144.103-118.85-168.956"
      />
    </svg>
  ),
};
