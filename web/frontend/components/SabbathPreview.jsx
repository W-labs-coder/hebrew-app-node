import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const PreviewContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 1440px;
  height: auto;
  max-height: 100vh;
  overflow-y: auto;
  background: #FBFBFB;
  margin: 0 auto;
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: row-reverse;
  justify-content: space-between;
  align-items: center;
  padding: 39px 100px;
`;

const Logo = styled.div`
  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #333;
    text-transform: capitalize;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  gap: 32px;
  width: 730px;
  margin: 0 auto;
  background: ${(props) => props.bgColor || "#FFFFFF"};
  color: ${(props) => props.textColor || "#000000"};
`;

const Banner = styled.div`
  width: 100%;
  padding: 16px;
  background: ${props => props.bgColor || '#FFFFFF'};
  min-height: 282px;
  border-radius: 16px;
  text-align: center;
  color: ${props => props.textColor || '#000000'};
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => !props.imageUrl && (props.bgColor || '#FFFFFF')};
    border-radius: 16px;
  }

  h2, p {
    position: relative;
    z-index: 1;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  z-index: 1000;

  &:hover {
    background: rgba(0, 0, 0, 0.7);
  }
`;

const SocialLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 16px;
  background: #FBFBFB;
  border: 1px solid #C6C6C6;
  box-shadow: 0px 5px 10px -2px rgba(0, 0, 0, 0.15);
  border-radius: 16px;
`;

const Countdown = styled.div`
  display: flex;
  gap: 32px;
  justify-content: center;
  margin-top: 32px;
  align-items: center;
`;

const TimeBox = styled.div`
  width: 115px;
  height: 115px;
  background: #F2F2F2;
  border: 1px solid #C6C6C6;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap:20px;
  
  .number {
    font-size: 56px;
    font-weight: 500;
    color: #0D0D0D;
  }
  
  .label {
    font-size: 14px;
    color: #777777;
  }
`;

const SocialIconsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px 190px;
  gap: 10px;
  width: 100px;
  margin-top: -32px ;
  margin-botton: 50px;
  background: #FBFBFB;
  border: 1px solid #C6C6C6;
  box-shadow: 0px 5px 10px -2px rgba(0, 0, 0, 0.15), 0px 0px 0px 1px rgba(0, 0, 0, 0.08);
  border-radius: 0px 0px 16px 16px;
`;

const SocialIconsGrid = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 24px;
  width: 300px;
  height: 30px;
`;

const SocialIcon = styled.img`
  width: 30px;
  height: 30px;
  background: #0D0D0D;
`;

const SocialSvgs = {
  telegram: (
    <svg width="28" height="26" viewBox="0 0 28 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.3801 22.5431L17.3801 22.5431L14.0552 18.7628C12.4092 16.8914 12.2143 16.069 12.3226 15.8917L13.5705 14.8867L18.6284 10.9305C19.0362 10.6115 19.1082 10.0223 18.7892 9.61449C18.4702 9.20667 17.881 9.13465 17.4732 9.45365L12.41 13.4139L10.8874 14.6567C10.5319 15.0381 10.3052 15.6905 10.5525 16.6182C10.7832 17.484 11.4303 18.6283 12.8083 20.1992L12.2994 21.2028C11.9707 21.6597 11.6655 22.0839 11.3846 22.3746C11.1056 22.6635 10.5985 23.0882 9.89217 22.9476C9.19517 22.809 8.8824 22.2328 8.72754 21.863C8.57026 21.4874 8.43705 20.978 8.29253 20.4254L7.66565 18.0299C7.31745 16.6993 7.19721 16.3168 6.97063 16.0353C6.94204 15.9998 6.91225 15.9654 6.88136 15.9323C6.64215 15.6762 6.30432 15.5186 5.06687 15.0226L4.99909 14.9954C3.7796 14.5066 2.77508 14.104 2.07248 13.7084C1.3918 13.3251 0.656752 12.768 0.572191 11.8279C0.559049 11.6818 0.559274 11.5347 0.572864 11.3887C0.660317 10.4488 1.39719 9.89395 2.07907 9.51296C2.7829 9.1197 3.78867 8.72041 5.00966 8.23568L19.9898 2.28815L19.9898 2.28814C21.5221 1.67973 22.775 1.18224 23.7595 0.955428C24.7633 0.724184 25.8002 0.699703 26.6127 1.45126C27.4091 2.18799 27.5044 3.22584 27.4052 4.27184C27.3068 5.30963 26.983 6.65927 26.5836 8.32412L23.559 20.9329L23.559 20.933C23.3045 21.9943 23.0896 22.8901 22.8319 23.5402C22.5716 24.1968 22.1541 24.9021 21.3106 25.1251C20.4567 25.3509 19.7511 24.93 19.2149 24.4762C18.6881 24.0304 18.0874 23.3473 17.3801 22.5431Z" fill="#0D0D0D"/>
    </svg>
  ),
  tiktok: (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M12.9285 0.1875H13.0715C15.8098 0.187483 17.9607 0.187471 19.64 0.413242C21.3608 0.644602 22.7261 1.12839 23.7989 2.20114C24.8716 3.27389 25.3554 4.63921 25.5868 6.36003C25.8125 8.03929 25.8125 10.1902 25.8125 12.9285V13.0715C25.8125 15.8099 25.8125 17.9607 25.5868 19.64C25.3554 21.3608 24.8716 22.7261 23.7989 23.7989C22.7261 24.8716 21.3608 25.3554 19.64 25.5868C17.9607 25.8125 15.8098 25.8125 13.0715 25.8125H12.9285C10.1901 25.8125 8.03929 25.8125 6.36003 25.5868C4.63921 25.3554 3.27389 24.8716 2.20114 23.7989C1.12839 22.7261 0.644601 21.3608 0.413242 19.64C0.187471 17.9607 0.187484 15.8099 0.1875 13.0715V13.0715L0.1875 12.9285V12.9285C0.187484 10.1901 0.187471 8.0393 0.413242 6.36003C0.644601 4.63921 1.12839 3.27389 2.20114 2.20114C3.27389 1.12839 4.63921 0.644602 6.36003 0.413242C8.03929 0.187471 10.1902 0.187483 12.9285 0.1875ZM15.8846 6.03572C15.8846 5.39467 15.368 4.875 14.7308 4.875C14.0935 4.875 13.5769 5.39467 13.5769 6.03572V15.9018C13.5769 17.5044 12.2854 18.8036 10.6923 18.8036C9.09918 18.8036 7.80769 17.5044 7.80769 15.9018C7.80769 14.2992 9.09918 13 10.6923 13C10.8334 13 10.9714 13.0101 11.1058 13.0294C11.7367 13.1202 12.3212 12.6794 12.4115 12.0448C12.5017 11.4102 12.0634 10.8222 11.4326 10.7314C11.1902 10.6965 10.943 10.6786 10.6923 10.6786C7.82468 10.6786 5.5 13.0171 5.5 15.9018C5.5 18.7865 7.82468 21.125 10.6923 21.125C13.5599 21.125 15.8846 18.7865 15.8846 15.9018V10.1239C16.8843 10.8272 18.1153 11.2589 19.3462 11.2589C19.9834 11.2589 20.5 10.7393 20.5 10.0982C20.5 9.45717 19.9834 8.9375 19.3462 8.9375C18.5263 8.9375 17.6292 8.59507 16.9417 8.01746C16.2552 7.44067 15.8846 6.72707 15.8846 6.03572Z" fill="#0D0D0D"/>
    </svg>
  ),
  facebook: (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.9022 6.43947C16.8077 6.43938 15.8344 6.4393 15.0486 6.54497C14.1946 6.65983 13.3322 6.92469 12.6274 7.62973C11.9226 8.33477 11.6578 9.19742 11.543 10.0517C11.4373 10.8377 11.4374 11.8113 11.4375 12.9061L11.4375 13.9418H10.5C9.63706 13.9418 8.9375 14.6416 8.9375 15.5048C8.9375 16.368 9.63706 17.0678 10.5 17.0678H11.4375V24.5647C11.4375 25.1575 11.4375 25.4539 11.2516 25.6375C11.0658 25.8211 10.7716 25.8174 10.1834 25.8099C8.69657 25.7911 7.43219 25.7389 6.36003 25.5948C4.63921 25.3633 3.27389 24.8794 2.20114 23.8063C1.12839 22.7332 0.644602 21.3675 0.413243 19.6461C0.187472 17.9663 0.187484 15.8148 0.1875 13.0756V12.9325C0.187484 10.1933 0.187472 8.04177 0.413243 6.36197C0.644602 4.64061 1.12839 3.27486 2.20114 2.20177C3.27389 1.12869 4.63921 0.644745 6.36003 0.413313C8.03929 0.187472 10.1902 0.187484 12.9285 0.1875H13.0715C15.8098 0.187484 17.9607 0.187472 19.64 0.413313C21.3608 0.644745 22.7261 1.12869 23.7989 2.20177C24.8716 3.27486 25.3554 4.64061 25.5868 6.36197C25.8125 8.04176 25.8125 10.1933 25.8125 12.9326V13.0756C25.8125 15.8148 25.8125 17.9663 25.5868 19.6461C25.3554 21.3675 24.8716 22.7332 23.7989 23.8063C22.7261 24.8794 21.3608 25.3633 19.64 25.5948C18.5678 25.7389 17.3034 25.7911 15.8166 25.8099C15.2284 25.8174 14.9342 25.8211 14.7484 25.6375C14.5625 25.4539 14.5625 25.1575 14.5625 24.5646V17.0678H16.75C17.6129 17.0678 18.3125 16.368 18.3125 15.5048C18.3125 14.6416 17.6129 13.9418 16.75 13.9418H14.5625V13.004C14.5625 11.781 14.5658 11.0209 14.6401 10.4683C14.7071 9.96947 14.8061 9.87094 14.8356 9.84164L14.8371 9.84014L14.8386 9.83863C14.8679 9.80917 14.9664 9.71014 15.465 9.64308C16.0175 9.56878 16.7773 9.56546 18 9.56546H19.25C20.1129 9.56546 20.8125 8.86569 20.8125 8.00247C20.8125 7.13925 20.1129 6.43948 19.25 6.43948L17.9022 6.43947Z" fill="#0D0D0D"/>
    </svg>
  ),
  whatsapp: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M14 0.562479C6.57869 0.562479 0.562521 6.57865 0.562521 14C0.562521 15.8511 0.937361 17.6171 1.61617 19.2243C1.79424 19.6459 1.91428 19.9308 1.99446 20.1498C2.07624 20.3731 2.08773 20.4539 2.08917 20.4747C2.09729 20.5921 2.06759 20.7517 1.8649 21.5092L0.594379 26.2577C0.507838 26.5811 0.600358 26.9261 0.837109 27.1629C1.07386 27.3996 1.4189 27.4922 1.74234 27.4056L6.4908 26.1351C7.24834 25.9324 7.40794 25.9027 7.52532 25.9108C7.54615 25.9123 7.62693 25.9238 7.85024 26.0055C8.06917 26.0857 8.35408 26.2058 8.7757 26.3838C10.3829 27.0626 12.1489 27.4375 14 27.4375C21.4213 27.4375 27.4375 21.4213 27.4375 14C27.4375 6.57865 21.4213 0.562479 14 0.562479ZM10.2161 6.81251L10.1003 6.81238C9.50073 6.81137 8.94761 6.81043 8.40364 7.0589C8.00845 7.23942 7.67218 7.54611 7.42732 7.85242C7.18247 8.15874 6.95737 8.5543 6.86833 8.97955C6.74628 9.56248 6.84694 10.006 6.95461 10.4805L6.96948 10.5461C7.51262 12.9515 8.7824 15.3101 10.7359 17.2636C12.6894 19.2171 15.048 20.4869 17.4534 21.03L17.519 21.0449C17.9935 21.1525 18.437 21.2532 19.0199 21.1311C19.4452 21.0421 19.8407 20.817 20.1471 20.5722C20.4534 20.3273 20.7601 19.991 20.9406 19.5958C21.189 19.0519 21.1881 18.4988 21.1871 17.8992L21.187 17.7834C21.187 17.5079 21.1785 17.044 20.9998 16.6152C20.7863 16.103 20.3466 15.6808 19.6573 15.5728L19.6501 15.5717C18.7957 15.4378 18.1464 15.336 17.687 15.2693C17.4572 15.2358 17.2664 15.2099 17.1171 15.193C16.9944 15.179 16.8256 15.1615 16.6844 15.1698C16.0724 15.2056 15.5857 15.4538 15.2087 15.7122C14.9688 15.8766 14.7081 16.0968 14.5031 16.2699C14.4226 16.3379 14.3507 16.3987 14.292 16.4459L14.0441 16.6455C13.7497 16.8825 13.6025 17.0011 13.4226 16.9987C13.2427 16.9964 13.106 16.8804 12.8328 16.6485C12.5692 16.4248 12.3119 16.1879 12.0617 15.9377C11.8116 15.6876 11.5747 15.4302 11.351 15.1667C11.119 14.8934 11.0031 14.7568 11.0007 14.5769C10.9984 14.397 11.1169 14.2498 11.354 13.9554L11.5536 13.7075C11.6008 13.6488 11.6616 13.5769 11.7296 13.4964L11.7296 13.4963C11.9027 13.2913 12.1229 13.0307 12.2873 12.7907C12.5457 12.4138 12.7939 11.927 12.8297 11.3151C12.838 11.1739 12.8204 11.0051 12.8065 10.8824C12.7896 10.7331 12.7636 10.5423 12.7302 10.3124C12.6635 9.85308 12.5617 9.20375 12.4278 8.34934L12.4278 8.34931L12.4267 8.34219C12.3186 7.65289 11.8965 7.21314 11.3843 6.99969C10.9555 6.82101 10.4916 6.81251 10.2161 6.81251Z" fill="#0D0D0D"/>
    </svg>
  ),
  youtube: (
    <svg width="28" height="24" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M7.37108 1.08967C9.44481 0.666952 11.6769 0.4375 14.0001 0.4375C16.3234 0.4375 18.5555 0.666952 20.6292 1.08967L20.7883 1.12207C23.1566 1.60411 24.7346 1.9253 26.0944 3.67365C27.4396 5.40323 27.4389 7.40899 27.4377 10.5155V10.5155V13.4845V13.4845C27.4389 16.591 27.4396 18.5968 26.0944 20.3264C24.7346 22.0747 23.1566 22.3959 20.7883 22.8779L20.6292 22.9103C18.5555 23.333 16.3234 23.5625 14.0001 23.5625C11.6769 23.5625 9.44481 23.333 7.37108 22.9103L7.21198 22.8779C4.84369 22.3959 3.26569 22.0747 1.90587 20.3264C0.56065 18.5968 0.561402 16.591 0.562568 13.4845L0.562568 10.5155C0.561402 7.409 0.56065 5.40323 1.90587 3.67365C3.26569 1.9253 4.84369 1.60411 7.21198 1.12207L7.37108 1.08967ZM13.1183 7.31531C13.7665 7.58733 14.5538 8.02704 15.5164 8.56466C15.6432 8.63543 15.7705 8.70572 15.898 8.7761C16.5272 9.12348 17.1601 9.47288 17.7437 9.89254C18.2682 10.2697 18.7659 10.7371 18.9306 11.4186C19.0231 11.8013 19.0231 12.1987 18.9306 12.5814C18.7659 13.2629 18.2682 13.7303 17.7437 14.1075C17.1601 14.5271 16.5271 14.8766 15.8979 15.224C15.7704 15.2943 15.6431 15.3646 15.5165 15.4353C14.5538 15.973 13.7665 16.4127 13.1183 16.6847C12.0646 17.1269 10.9471 17.1627 10.0288 16.4102C9.45395 15.9393 9.25076 15.2649 9.16162 14.5854C8.94617 12.9429 8.94608 11.0577 9.16162 9.41465C9.25076 8.73508 9.45395 8.06073 10.0288 7.58976C10.9471 6.83729 12.0646 6.87307 13.1183 7.31531Z" fill="#0D0D0D"/>
    </svg>
  ),
  twitter: (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.0727 10.2971C13.9309 7.04502 16.5718 4.0625 20.0001 4.0625C21.3432 4.0625 22.5837 4.50943 23.5786 5.26171L27.3618 4.69775C27.709 4.64599 28.0561 4.79254 28.2611 5.07751C28.4661 5.36248 28.4947 5.7381 28.3353 6.05084L25.9182 10.7913C25.5055 19.2261 18.5368 25.9375 10.0001 25.9375C7.13151 25.9375 4.40236 25.3085 2.03063 23.9365C1.67855 23.7328 1.49797 23.3254 1.58355 22.9277C1.66913 22.5301 2.00136 22.233 2.40605 22.1922C3.28436 22.1037 4.6116 21.8508 5.69488 21.4563C6.24102 21.2574 6.66728 21.043 6.93942 20.8344C6.96587 20.8141 6.98957 20.7949 7.01078 20.7769C3.21775 16.6047 1.88506 10.2145 3.45939 4.86677C3.56315 4.51431 3.86325 4.25495 4.22702 4.20333C4.5908 4.15171 4.9512 4.31736 5.14891 4.62704C7.16113 7.77881 10.4579 10.1189 14.0727 10.2971Z" fill="#0D0D0D"/>
    </svg>
  ),
  // Add a default icon for unknown platforms
  default: (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0.5C6.1 0.5 0.5 6.1 0.5 13C0.5 19.9 6.1 25.5 13 25.5C19.9 25.5 25.5 19.9 25.5 13C25.5 6.1 19.9 0.5 13 0.5ZM13 23.5C7.21 23.5 2.5 18.79 2.5 13C2.5 7.21 7.21 2.5 13 2.5C18.79 2.5 23.5 7.21 23.5 13C23.5 18.79 18.79 23.5 13 23.5Z" fill="#0D0D0D"/>
    </svg>
  )
};

const detectSocialPlatform = (url) => {
  if (!url) return 'default';
  
  const platforms = {
    telegram: /telegram/i,
    tiktok: /tiktok/i,
    facebook: /facebook|fb\.com/i,
    whatsapp: /whatsapp/i,
    youtube: /youtube/i,
    twitter: /twitter|x\.com/i
  };

  for (const [platform, regex] of Object.entries(platforms)) {
    if (regex.test(url)) return platform;
  }

  return 'default';
};

const calculateTimeLeft = (openingDay, openingTime) => {
  const now = new Date();
  const [hours, minutes] = openingTime.split(':');
  const target = new Date();
  
  // Set the target date to next occurrence of opening day
  const days = {
    'Saturday': 6,
    'Sunday': 0
  };
  
  let targetDay = days[openingDay];
  let daysUntil = targetDay - now.getDay();
  if (daysUntil <= 0) daysUntil += 7;
  
  target.setDate(target.getDate() + daysUntil);
  target.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const difference = target - now;

  if (difference > 0) {
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  }

  return null;
};

const SabbathPreview = ({
  bannerText,
  bannerBgColor,
  bannerTextColor,
  socialLinks,
  imageUrl,
  openingDay,
  openingTime,
  storeName,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const [hour, minute] = openingTime.split(":" ).map(Number);

      const nextOpening = new Date();
      nextOpening.setDate(now.getDate() + ((7 + getDayIndex(openingDay) - now.getDay()) % 7));
      nextOpening.setHours(hour, minute, 0, 0);

      const diff = nextOpening - now;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [openingDay, openingTime]);

  const getDayIndex = (day) => {
    const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    return days.indexOf(day);
  };

  return (
    <div
      style={{
        background: "#fff",
        padding: "2rem",
        maxWidth: "500px",
        width: "90%",
        textAlign: "center",
        borderRadius: "12px",
        fontFamily: "'Arial', sans-serif",
        position: "relative",
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          fontSize: "1.5rem",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        ✕
      </button>

      {/* Header */}
      <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem", fontWeight: "bold" }}>
        THANK <span style={{ color: "red" }}>🙏 YOU</span>
      </h2>

      {/* Main Message */}
      <p style={{ fontSize: "1.25rem", margin: "0.5rem 0" }}>שבת שלום.</p>
      <p style={{ fontSize: "1.25rem", margin: "0.5rem 0" }}>החנות סגורה כעת.</p>
      <p style={{ fontSize: "1rem", marginTop: "1.5rem" }}>
        נחזור לפעילות במוצ"ש בעוד:
      </p>

      {/* Countdown */}
      <div style={{ fontSize: "2.5rem", fontWeight: "bold", margin: "1rem 0" }}>
        {String(timeLeft.hours).padStart(2, "0")}:
        {String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </div>

      {/* Time Labels */}
      <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1.5rem" }}>
        <span style={{ margin: "0 8px" }}>שעות</span>
        <span style={{ margin: "0 8px" }}>דקות</span>
        <span style={{ margin: "0 8px" }}>שניות</span>
      </div>

      {/* Contact & Social */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <a href="#" style={{ textDecoration: "underline", color: "#000" }}>
          צור קשר
        </a>
        {socialLinks?.map((link, idx) => (
              <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-2"
            >
              <img
                src={`/icons/${iconName}.svg`}
                alt={link.name}
                className="w-6 h-6"
              />
            </a>
        ))}
      </div>

      {/* Note */}
      <p style={{ fontSize: "0.75rem", color: "#999" }}>
        *החנות תפתח ביום שבת בשעה {openingTime}
      </p>
    </div>
  );
};

const getSocialIcon = (name) => {
  switch (name.toLowerCase()) {
    case "facebook":
      return "https://cdn-icons-png.flaticon.com/512/124/124010.png";
    case "instagram":
      return "https://cdn-icons-png.flaticon.com/512/2111/2111463.png";
    case "tiktok":
      return "https://cdn-icons-png.flaticon.com/512/3046/3046122.png";
    default:
      return "https://cdn-icons-png.flaticon.com/512/25/25694.png";
  }
};

export default SabbathPreview;