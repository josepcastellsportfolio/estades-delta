from estades.delta import PACKAGE_NAME


class TestSetupInstall:
    def test_addon_installed(self, installer):
        """Test if estades.delta is installed."""
        assert installer.is_product_installed(PACKAGE_NAME) is True

    def test_browserlayer(self, browser_layers):
        """Test that IBrowserLayer is registered."""
        from estades.delta.interfaces import IBrowserLayer

        assert IBrowserLayer in browser_layers

    def test_latest_version(self, profile_last_version):
        """Test latest version of default profile.

        Bumped to 1001 in Day 2 when Property gained the `palette` field and
        we added the corresponding back-fill upgrade step.
        """
        assert profile_last_version(f"{PACKAGE_NAME}:default") == "1001"
