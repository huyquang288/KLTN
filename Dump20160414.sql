CREATE DATABASE  IF NOT EXISTS `messenger_developer` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `messenger_developer`;
-- MySQL dump 10.13  Distrib 5.6.23, for Win64 (x86_64)
--
-- Host: localhost    Database: messenger_developer
-- ------------------------------------------------------
-- Server version	5.6.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account_user`
--

DROP TABLE IF EXISTS `account_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `account_user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `accountId` int(10) unsigned NOT NULL,
  `userId` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_account_fk1_idx` (`accountId`),
  KEY `user_account_fk2_idx` (`userId`),
  CONSTRAINT `user_account_fk1` FOREIGN KEY (`accountId`) REFERENCES `accounts` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `user_account_fk2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_user`
--

LOCK TABLES `account_user` WRITE;
/*!40000 ALTER TABLE `account_user` DISABLE KEYS */;
INSERT INTO `account_user` VALUES (1,1,1),(2,2,2),(3,3,3),(4,4,4);
/*!40000 ALTER TABLE `account_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `accounts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(45) NOT NULL,
  `password` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` VALUES (1,'1','c4ca4238a0b923820dcc509a6f75849b'),(2,'2','c4ca4238a0b923820dcc509a6f75849b'),(3,'3','c4ca4238a0b923820dcc509a6f75849b'),(4,'4','c4ca4238a0b923820dcc509a6f75849b'),(5,'5','c4ca4238a0b923820dcc509a6f75849b'),(6,'6','c4ca4238a0b923820dcc509a6f75849b');
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookmark`
--

DROP TABLE IF EXISTS `bookmark`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bookmark` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userId` int(10) unsigned NOT NULL,
  `topicId` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bookmark_fk1_idx` (`userId`),
  KEY `bookmark_fk2_idx` (`topicId`),
  CONSTRAINT `bookmark_fk1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `bookmark_fk2` FOREIGN KEY (`topicId`) REFERENCES `topics` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookmark`
--

LOCK TABLES `bookmark` WRITE;
/*!40000 ALTER TABLE `bookmark` DISABLE KEYS */;
INSERT INTO `bookmark` VALUES (13,1,2),(15,1,1);
/*!40000 ALTER TABLE `bookmark` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_group`
--

DROP TABLE IF EXISTS `group_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group_group` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `firstGroupId` int(10) unsigned NOT NULL,
  `secondGroupId` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk1_idx` (`firstGroupId`),
  KEY `fk2_idx` (`secondGroupId`),
  CONSTRAINT `fk1` FOREIGN KEY (`firstGroupId`) REFERENCES `groups` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk2` FOREIGN KEY (`secondGroupId`) REFERENCES `groups` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_group`
--

LOCK TABLES `group_group` WRITE;
/*!40000 ALTER TABLE `group_group` DISABLE KEYS */;
INSERT INTO `group_group` VALUES (1,1,2),(2,1,3),(3,2,3),(4,5,3),(5,1,4),(6,1,5),(7,1,6),(8,1,7),(10,1,9);
/*!40000 ALTER TABLE `group_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_user`
--

DROP TABLE IF EXISTS `group_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group_user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `groupId` int(10) unsigned NOT NULL,
  `userId` int(10) unsigned NOT NULL,
  `isAdmin` int(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `groupId` (`groupId`),
  KEY `userId` (`userId`),
  CONSTRAINT `group_user_ibfk_1` FOREIGN KEY (`groupId`) REFERENCES `groups` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `group_user_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_user`
--

LOCK TABLES `group_user` WRITE;
/*!40000 ALTER TABLE `group_user` DISABLE KEYS */;
INSERT INTO `group_user` VALUES (1,1,1,1),(2,1,2,0),(3,2,1,1),(4,3,1,1),(6,5,3,1),(7,2,4,0),(8,6,2,1),(9,3,2,0),(18,1,5,0),(19,2,6,0),(20,4,6,0),(37,6,2,0),(38,7,3,0),(40,9,1,1);
/*!40000 ALTER TABLE `group_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `groups` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `description` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groups`
--

LOCK TABLES `groups` WRITE;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
INSERT INTO `groups` VALUES (1,'SGUET','UET support group'),(2,'K57C','UET K57 IT\'s group'),(3,'K57CLC','K57CLC\'s group'),(4,'K57CA','K57CA\'s group'),(5,'K57CB','K57CB\'s group'),(6,'K57CD','K57CD\'s group'),(7,'K57T','K57T\'s group'),(9,'BM HTTT','HTTT\'s group');
/*!40000 ALTER TABLE `groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tags` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `groupId` int(10) unsigned NOT NULL,
  `topicId` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_tag_1_idx` (`groupId`),
  KEY `fk_tag_2_idx` (`topicId`),
  CONSTRAINT `fk_tag_1` FOREIGN KEY (`groupId`) REFERENCES `groups` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_tag_2` FOREIGN KEY (`topicId`) REFERENCES `topics` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
INSERT INTO `tags` VALUES (18,5,4);
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topicchats`
--

DROP TABLE IF EXISTS `topicchats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `topicchats` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userId` int(10) unsigned NOT NULL,
  `userAvata` varchar(100) DEFAULT NULL,
  `chatText` tinytext NOT NULL,
  `toTopicId` int(10) unsigned DEFAULT NULL,
  `dateTime` varchar(70) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `chats_ibfk_2` (`toTopicId`),
  CONSTRAINT `topicchats_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `topicchats_ibfk_2` FOREIGN KEY (`toTopicId`) REFERENCES `topics` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `topicchats`
--

LOCK TABLES `topicchats` WRITE;
/*!40000 ALTER TABLE `topicchats` DISABLE KEYS */;
INSERT INTO `topicchats` VALUES (1,1,'img/icon/male.jpg','xin chào tất cả mọi người :D',1,'2016-04-10T13:39:48.810Z'),(2,2,'img/icon/female.jpg','chào huy quang',1,'2016-04-10T18:34:57.045Z'),(3,1,'img/icon/male.jpg','chào bạn, bạn có thể gửi cho mình tài liệu môn CTDL không?',1,'2016-04-10T18:35:20.759Z'),(4,1,'img/icon/male.jpg','bạn muốn xin bài giảng hay bài tập',1,'2016-04-10T18:40:52.432Z'),(5,2,'img/icon/female.jpg','mình muốn xin cả 2',1,'2016-04-10T18:41:03.621Z'),(6,2,'img/icon/female.jpg','bạn gửi vào email cho mình nhé.',1,'2016-04-10T18:55:34.906Z'),(7,1,'img/icon/male.jpg','tình hình là sắp thi giữa kì, các bạn ôn thi được nhiều chưa ~~',6,'2016-04-11T06:21:12.170Z'),(8,2,'img/icon/female.jpg','Các bạn viết xong báo cáo môn Niên luận chưa??',9,'2016-04-11T06:24:39.027Z'),(9,1,'img/icon/male.jpg','lớp mình ra trường các bạn có dự định phỏng vấn vào viettel không?',4,'2016-04-12T16:44:36.632Z');
/*!40000 ALTER TABLE `topicchats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topics`
--

DROP TABLE IF EXISTS `topics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `topics` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `groupId` int(10) unsigned NOT NULL,
  `type` int(1) NOT NULL DEFAULT '1',
  `thumbnail` varchar(45) CHARACTER SET latin1 DEFAULT NULL,
  `title` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk2_idx` (`groupId`),
  KEY `fgc2_idx` (`groupId`),
  CONSTRAINT `fgc2` FOREIGN KEY (`groupId`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `topics`
--

LOCK TABLES `topics` WRITE;
/*!40000 ALTER TABLE `topics` DISABLE KEYS */;
INSERT INTO `topics` VALUES (1,1,1,NULL,'Xin tài liệu'),(2,2,1,NULL,'Chuẩn bị tốt nghiệp'),(3,4,1,NULL,'Báo cáo nghiên cứu khoa học'),(4,3,0,NULL,'Xin việc'),(5,9,1,NULL,'Database topic'),(6,1,0,NULL,'Trao đổi ôn thi cuối kì'),(8,1,0,'','Ngày hội việc làm'),(9,3,1,'','Nộp báo cáo niên luận');
/*!40000 ALTER TABLE `topics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unfollow_topic`
--

DROP TABLE IF EXISTS `unfollow_topic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unfollow_topic` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userId` int(10) unsigned NOT NULL,
  `topicId` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `unfollow_fk1_idx` (`userId`),
  KEY `unfollow_fk2_idx` (`topicId`),
  CONSTRAINT `unfollow_fk1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `unfollow_fk2` FOREIGN KEY (`topicId`) REFERENCES `topics` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unfollow_topic`
--

LOCK TABLES `unfollow_topic` WRITE;
/*!40000 ALTER TABLE `unfollow_topic` DISABLE KEYS */;
/*!40000 ALTER TABLE `unfollow_topic` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userchats`
--

DROP TABLE IF EXISTS `userchats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `userchats` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userSendId` int(10) unsigned NOT NULL,
  `userReceiveId` int(10) unsigned NOT NULL,
  `userSendAvata` varchar(45) CHARACTER SET utf8mb4 DEFAULT NULL,
  `userReceiveAvata` varchar(45) CHARACTER SET utf8mb4 DEFAULT NULL,
  `chatText` varchar(45) NOT NULL,
  `dateTime` varchar(70) CHARACTER SET utf8mb4 DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_chat_fk1_idx` (`userSendId`),
  KEY `user_chat_fk2_idx` (`userReceiveId`),
  CONSTRAINT `user_chat_fk1` FOREIGN KEY (`userSendId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `user_chat_fk2` FOREIGN KEY (`userReceiveId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userchats`
--

LOCK TABLES `userchats` WRITE;
/*!40000 ALTER TABLE `userchats` DISABLE KEYS */;
/*!40000 ALTER TABLE `userchats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `firstName` varchar(45) NOT NULL,
  `lastName` varchar(45) NOT NULL,
  `gender` int(1) NOT NULL DEFAULT '0',
  `face` varchar(45) CHARACTER SET latin1 DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Huy','Quang',0,'img/icon/male.jpg'),(2,'Kagome','Chan',1,'img/icon/female.jpg'),(3,'Hoàn','Trần',0,'img/icon/male.jpg'),(4,'Hưng','Lùn',0,'img/icon/male.jpg'),(5,'Jin','san',1,'img/icon/female.jpg'),(6,'Học','buffalo',0,'img/icon/male.jpg');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2016-04-14 21:26:48
