-- phpMyAdmin SQL Dump
-- version 4.9.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 10, 2020 at 02:06 AM
-- Server version: 10.4.10-MariaDB
-- PHP Version: 7.3.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `assets_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `assets`
--

CREATE TABLE `assets` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `serial_no` varchar(50) NOT NULL,
  `unit_name` varchar(50) NOT NULL,
  `qty` int(11) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `unit_type` varchar(50) NOT NULL,
  `date_received` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `assets`
--

INSERT INTO `assets` (`id`, `room_id`, `serial_no`, `unit_name`, `qty`, `unit`, `unit_type`, `date_received`) VALUES
(6, 14, '1213RT', 'Acer', 1, 'Unit', 'Desktop Computer', '2020-02-24'),
(8, 14, '243aef', 'Intercooler', 1, 'Unit', 'Aircon', '2020-02-24'),
(10, 13, '23444', 'Acer', 1, 'Unit', 'Desktop Computer', '2020-02-24'),
(11, 18, '12344', 'Acer', 1, 'Unit', 'Desktop Computer', '2020-03-06'),
(13, 19, 'we123', 'Acer', 1, 'Unit', 'Desktop Computer', '2020-03-06'),
(14, 13, '23452', 'Intercooler', 1, 'Unit', 'Aircon', '2020-03-06'),
(15, 13, '1234dsf', 'Acer', 1, 'Unit', 'Desktop Computer', '2020-03-06');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `bldg_id` int(11) NOT NULL,
  `rooms` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `bldg_id`, `rooms`) VALUES
(13, 1, 'ICT Lab2'),
(14, 1, 'ICT Lab1'),
(18, 1, 'ICT Lab3'),
(19, 1, 'ICT Lab4');

-- --------------------------------------------------------

--
-- Table structure for table `slsu_bldg`
--

CREATE TABLE `slsu_bldg` (
  `id` int(11) NOT NULL,
  `bldg_name` varchar(250) NOT NULL,
  `college_head` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `slsu_bldg`
--

INSERT INTO `slsu_bldg` (`id`, `bldg_name`, `college_head`) VALUES
(1, 'CSIT BUILDING', 'Dr. Alex Bacalla'),
(12, 'OFFICE OF INDUSTRIAL TECHNOLOGY', 'Dr. Samuel Olaybar'),
(13, 'CRIMINOLOGY BUILDING', 'Dr. Bernadeth Pana'),
(14, 'RELATED SUBJECT BUILDING 1', 'Dr. Elvie Duran'),
(15, 'SUPPLY & PROPERTY MANAGEMENT OFFICE BUILDING', 'Dr. Mavel Calva'),
(16, 'DRAFTING TECHNOLOGY BUILDING', 'Dr. Samuel Olaybar'),
(17, 'ACCREDITATION BUILDING', 'Dr. Mavel Calva'),
(18, 'HRTM BUILDING', 'Dr. Ingrid Uy'),
(19, 'ADMINISTRATION BUILDING', 'Dr. Mavel Calva'),
(20, 'INDUSTRIAL TECHNOLOGY BUILDING 1', 'Dr. Samuel Olaybar'),
(21, 'INDUSTRIAL TECHNOLOGY BUILDING 2', 'Dr. Samuel Olaybar'),
(22, 'INDUSTRIAL TECHNOLOGY BUILDING 3', 'Dr. Samuel Olaybar'),
(23, 'INDUSTRIAL TECHNOLOGY BUILDING 4', 'Dr. Samuel Olaybar'),
(24, 'ARTS AND SCIENCES BUILDING W/ PROPOSED SOLAR POWER (HYBRID)', 'Dr. Elvie Duran'),
(25, 'INDUSTRIAL EDUCATION BUILDING', 'Dr. Loredel Siega'),
(26, 'MECHATRONICS BUILDING', 'Dr. Elvie Lobo'),
(27, 'MULTIMEDIA CENTER', 'Dr. Elvie Lobo'),
(28, 'ENGINEERING BUILDING', 'Dr.Elvie Lobo'),
(29, 'UNIVERSITY SOCIAL SERVICES CENTER/ USSC', 'Dr. Annabelle Hufalar'),
(30, 'CERAMICS BUILDING', 'Dr. Samuel Olaybar'),
(31, 'CRIMINOLOGY OFFICE', 'Dr. Bernadeth Pana'),
(32, 'PROPOSED NSTP & DRRM BUILDING', 'Dr. Samuel Olaybar'),
(33, 'PROPOSED MOTOR POOL', 'Dr. Mavel Calva'),
(34, 'FOOD TECHNOLOGY LABORATORY BUILDING', 'Dr. Elvie Lobo'),
(35, 'MULTI-PURPOSE COURT (MPC)', 'Dr. Mavel Calva'),
(36, 'SLSU COOP BUILDING', 'Dr. Rhoderick Malangsa'),
(37, 'GRADUATE SCHOOL BUILDING', 'Dr. Annabelle Hufalar'),
(38, 'RELATED SUBJECTS BUILDING 2', 'Dr. Elvie Duran'),
(39, 'POWER HOUSE 1', 'Dr. Mavel Calva'),
(40, 'POWER HOUSE 2', 'Dr. Mavel Calva'),
(41, 'POWER HOUSE 3', 'Dr. Mavel Calva'),
(42, 'POWER HOUSE 4', 'Dr. Mavel Calva'),
(43, 'GRANDSTAND', 'Dr. Mavel Calva'),
(44, 'ALUMNI BUILDING', 'Dr. Mavel Calva'),
(45, 'PROPOSED UNIVERSITY LIBRARY W/ SOLAR POWER (HYBRID) SYSTEM', 'Dr. Mavel Calva'),
(46, 'PROPOSED COMPLETION OF LTDC/SLSU HOSTEL', 'Dr. Ingrid Uy');

-- --------------------------------------------------------

--
-- Table structure for table `user_table`
--

CREATE TABLE `user_table` (
  `id` int(11) NOT NULL,
  `email` varchar(150) NOT NULL,
  `email_pass` varchar(250) NOT NULL,
  `user_type` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `user_table`
--

INSERT INTO `user_table` (`id`, `email`, `email_pass`, `user_type`) VALUES
(2, 'nobeginmasob@gmail.com', '$2y$10$90HiTQjnpkFOEadk5XxxA.Xkmq73raeYDPVHzpcKeZ1HQarGKUToe', 'Super_Admin'),
(25, 'angelsfaith@gmail.com', '$2y$10$jR0G6ZbFdVGroSjhNbZyAu1uw4a6VsFhVAuQZw6n9K5HDB9K27dsK', 'Admin');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assets`
--
ALTER TABLE `assets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `rooms` (`rooms`);

--
-- Indexes for table `slsu_bldg`
--
ALTER TABLE `slsu_bldg`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_table`
--
ALTER TABLE `user_table`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assets`
--
ALTER TABLE `assets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `slsu_bldg`
--
ALTER TABLE `slsu_bldg`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `user_table`
--
ALTER TABLE `user_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
