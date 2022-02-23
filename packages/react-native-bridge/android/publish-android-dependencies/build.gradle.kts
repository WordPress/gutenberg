import org.json.JSONObject

val defaultCompileSdkVersion = 30
val defaultMinSdkVersion = 21
val defaultTargetSdkVersion = 30

// Set project extra properties
project.ext.set("compileSdkVersion", defaultCompileSdkVersion)
project.ext.set("minSdkVersion", defaultMinSdkVersion)
project.ext.set("targetSdkVersion", defaultTargetSdkVersion)
project.ext.set("react", extra( mapOf(
    "enableHermes" to true
)))

// Fetch dependencies versions from package.json
val reactNativeEditorPackageJson = File("$projectDir/../../../react-native-editor/package.json")
val packageJson = JSONObject(reactNativeEditorPackageJson.readText())
val packageDependencies = packageJson.optJSONObject("dependencies")
val rnVersion = packageDependencies.optString("react-native")

allprojects {
    group = "com.github.wordpress"
    
    // Set React Native Mirror Maven repository
    repositories {
        maven {
            setUrl("https://a8c-libs.s3.amazonaws.com/android/react-native-mirror")
        }
        google()
    }
}

plugins {
    id("com.android.library") apply false
    id("maven-publish")
}

subprojects {
    afterEvaluate {
        // Force that the dependency is built using the React Native version specified in package.json
        configurations.all {
            resolutionStrategy {
                force("com.facebook.react:react-native:$rnVersion")
            }
        }

        // Publish the dependency to Maven repository
        apply { plugin("maven-publish") }

        afterEvaluate {
            publishing {
                publications {
                    create<MavenPublication>(name) {
                        try {
                            // By default we use the release build variant as the artifact
                            from(components.get("release"))
                        } catch( e: Exception ) {
                            println("'$name' - Release build variant not defined, trying to use default artifact.")

                            // If release build variant is not defined, we try to use the first default artifact
                            val defaultArtifacts = configurations.getByName("default").artifacts
                            if(defaultArtifacts.isEmpty()) {
                                throw Exception("'$name' - No default artifact found, aborting publishing!")
                            }
                            val defaultArtifact = defaultArtifacts.getFiles().getSingleFile()
                            artifact(defaultArtifact)
                        }

                        // Although the React Native version is forced for building, it's not reflected in the POM file.
                        // For this reason, we need to directly modify the POM file.
                        pom.withXml {
                            val hasSingleNode = { xml: groovy.util.Node, name: String -> Boolean
                                val nodeList = xml.get(name) as groovy.util.NodeList
                                nodeList.size > 0
                            }
                            val getSingleNode = { xml: groovy.util.Node, name: String -> 
                                val nodeList = xml.get(name) as groovy.util.NodeList
                                if( nodeList.isEmpty() ) {
                                    throw Exception("No '$name' node found.")
                                }
                                nodeList[0]
                            }

                            if( hasSingleNode(asNode(), "dependencies") ) {
                                val dependenciesNode = getSingleNode(asNode(), "dependencies") as groovy.util.Node
                                val dependenciesChildren = dependenciesNode.get("dependency") as groovy.util.NodeList
                                dependenciesChildren.forEach {
                                    val dependencyNode = it as groovy.util.Node
                                    val groupId = getSingleNode(dependencyNode, "groupId") as groovy.util.Node
                                    val artifactId = getSingleNode(dependencyNode, "artifactId") as groovy.util.Node
                                    val version = getSingleNode(dependencyNode, "version") as groovy.util.Node
                                    if(artifactId.text() == "react-native") {
                                        println("Enforcing React Native version '$rnVersion' in POM file of '$name'")
                                        version.setValue(rnVersion)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}