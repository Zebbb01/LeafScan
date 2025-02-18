import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView, // Import ActivityIndicator for loading spinner
  Linking
} from "react-native";
import { useRoute } from "@react-navigation/native";
import axios, { CancelTokenSource } from "axios";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { useUser } from "../../context/UserProvider";
import { SERVER_URI } from "@/utils/uri";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import styles from "@/styles/scanner/scanner";

export default function ScannerScreen() {
  const route = useRoute();
  const router = useRouter();
  const { imageUri } = route.params as { imageUri: string };
  const { user } = useUser();
  const [loading, setLoading] = useState(false); // Controls the loading state
  const [modalVisible, setModalVisible] = useState(false);
  const [scanResult, setScanResult] = useState<{
    disease: string;
    confidence: number;
    prevention: string;
    cause: string;
    contributing_factors: string;
    more_info_url: string;
  } | null>(null);

  const cancelTokenSource = useRef<CancelTokenSource | null>(null);

  const resizeImage = async (uri: string) => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }], // Reduce width (height auto-adjusts)
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  };

  const scanImage = async () => {
    try {
      setLoading(true);
  
      // Resize Image
      const resizedUri = await resizeImage(imageUri);
      console.log("📸 Resized Image URI:", resizedUri);
  
      const fileInfo = await FileSystem.getInfoAsync(resizedUri);
      if (!fileInfo.exists) {
        console.error("❌ Resized file does not exist:", resizedUri);
        Alert.alert("Error", "File does not exist.");
        return;
      }
  
      // Convert to FormData
      const formData = new FormData();
      formData.append("image", {
        uri: resizedUri,
        name: "image.jpg",
        type: "image/jpeg",
      } as any);
  
      console.log("🚀 Uploading to:", `${SERVER_URI}/upload_image`);
  
      const apiResponse = await axios.post(`${SERVER_URI}/upload_image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      });
  
      console.log("✅ API Response Status:", apiResponse.status);
      console.log("✅ API Response Data:", apiResponse.data);
  
      if (apiResponse.status === 201) {
        const responseData = apiResponse.data;
        setScanResult(responseData);
        setModalVisible(true);
      } else {
        console.error("❌ Server responded with:", apiResponse.status, apiResponse.data);
        Alert.alert("Error", "Failed to scan image.");
      }
    } catch (error: any) {
      console.error("❌ Error scanning image:", error);
      if (error.response) {
        console.error("❌ Server Response:", error.response.data);
      }
      Alert.alert("Error", "Failed to scan image.");
    } finally {
      setLoading(false);
    }
  };
  
  
  const handleCancel = () => {
    if (cancelTokenSource.current) {
      cancelTokenSource.current.cancel();
      cancelTokenSource.current = null;
    }
    setScanResult(null);
    router.push("/(routes)/camera");
  };

  const handleHome = () => {
    router.push("/(routes)/dashboard");
  };

  const handleViewResult = () => {
    if (scanResult) {
      setModalVisible(true);
    } else {
      Alert.alert("No Result", "Please scan an image first.");
    }
  };

  const handleChangeImage = () => {
    setScanResult(null);
    router.push("/(routes)/camera");
  };

  return (
    <LinearGradient colors={["#ffffff", "#F8EDE3"]} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.title}>You want to change?</Text>
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        )}

        {!scanResult && (
          <View style={styles.buttonContainer}>
            {/* Show spinner if loading, else show button */}
            {loading ? (
              <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="yellowgreen" />
              </View>
            ) : (
              <TouchableOpacity
                onPress={scanImage}
                style={styles.button}
                disabled={loading} // Disable button while loading
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="scan" size={20} color="white" />
                  <Text style={styles.buttonText}>Scan</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.cancelButton}
              disabled={loading} // Disable cancel button during loading
            >
              <Ionicons name="close-circle" size={20} color="white" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {scanResult && (
          <View style={styles.resultButtonContainer}>
            <TouchableOpacity
              onPress={handleChangeImage}
              style={styles.changeImageButton}
              disabled={loading} // Disable buttons while loading
            >
              <Text style={styles.buttonText}>Change Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleViewResult}
              style={styles.viewButton}
              disabled={loading} // Disable buttons while loading
            >
              <Ionicons name="eye" size={20} color="white" />
              <Text style={styles.viewButtonText}>View Result</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Please wait...</Text>
          </View>
        )}

      <TouchableOpacity
        onPress={handleHome}
        style={styles.homeButton}
        disabled={loading} // Disable home button during loading
      >
        <Ionicons name="home" size={20} color="white" />
        <Text style={styles.homeButtonText}>Dashboard</Text>
      </TouchableOpacity>

      <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalCloseIcon}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Scan Result</Text>
              <ScrollView contentContainerStyle={styles.modalScrollContent}>
                {scanResult &&  (
                  <>
                  <View style={styles.row}>
                    <View style={styles.column}>
                      <Text style={styles.modalLabel}>Disease:</Text>
                      <Text style={styles.modalText}>{scanResult.disease}</Text>
                    </View>
                    {scanResult.disease !== "Unrecognize" && scanResult.disease !== "N/A" && (
                      <View style={styles.column}>
                        <Text style={styles.modalLabel}>Accuracy:</Text>
                        <Text style={styles.modalText}>
                          {(scanResult.confidence * 1).toFixed(2)}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.description}>
                    <Text style={styles.modalLabel}>Cause:</Text>
                    <Text style={styles.modalText}>{scanResult.cause}</Text>
                    <Text style={styles.modalLabel}>Contributing Factors:</Text>
                    <Text style={styles.modalText}>{scanResult.contributing_factors}</Text>
                    <Text style={styles.modalLabel}>Prevention:</Text>
                    <Text style={styles.modalText}>{scanResult.prevention}</Text>
                    <Text style={styles.modalLabel}>More Info:</Text>
                      {scanResult.more_info_url && scanResult.more_info_url !== "N/A" ? (
                          <TouchableOpacity onPress={() => Linking.openURL(scanResult.more_info_url)}>
                              <Text style={[styles.modalText, { color: 'blue' }]}>Click here for more information</Text>
                          </TouchableOpacity>
                      ) : (
                          <Text style={styles.modalText}>No additional information available.</Text>
                      )}
                  </View> 
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </LinearGradient>
  );
}
